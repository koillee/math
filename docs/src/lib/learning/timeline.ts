import { prisma } from "@/lib/db";
import { ensureSeedData } from "./seed";

type Signal = { id: string; reason: string; weight: number };

type TimelineEvent = Awaited<ReturnType<typeof loadTimelineEvents>>[number];

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function safeSignals(value: unknown): Signal[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<Signal>;
      if (!candidate.id) return null;
      return {
        id: String(candidate.id),
        reason: String(candidate.reason ?? "Signal detected"),
        weight: Number(candidate.weight ?? 0),
      } satisfies Signal;
    })
    .filter((item): item is Signal => Boolean(item));
}

function signalMap(events: TimelineEvent[]) {
  const map = new Map<string, Signal & { count: number }>();
  for (const event of events) {
    for (const signal of safeSignals(event.misconceptionSignals)) {
      const existing = map.get(signal.id);
      map.set(signal.id, {
        ...signal,
        weight: (existing?.weight ?? 0) + signal.weight,
        count: (existing?.count ?? 0) + 1,
      });
    }
  }
  return map;
}

function loadTimelineEvents(studentId: string) {
  return prisma.evidenceEvent.findMany({
    where: {
      studentId,
      eventType: { in: ["Diagnostic Assessment", "Next Best Action", "Retention Practice", "Daily Practice"] },
      assessmentAttemptId: { not: null },
    },
    include: { skill: true },
    orderBy: { createdAt: "asc" },
  });
}

function scoreDelta(current: number, previous?: number) {
  if (previous === undefined) return null;
  return Math.round(current - previous);
}

function deltaLabel(delta: number | null, label: string) {
  if (delta === null) return `${label} evidence collected.`;
  if (delta > 0) return `${label} improved by ${delta} points.`;
  if (delta < 0) return `${label} decreased by ${Math.abs(delta)} points.`;
  return `${label} stayed stable.`;
}

function summarizeAttempt({
  index,
  avgAccuracy,
  avgExplanation,
  avgTransfer,
  reducedSignals,
  detectedSignals,
  improvedSkills,
  recommendation,
}: {
  index: number;
  avgAccuracy: number;
  avgExplanation: number;
  avgTransfer: number;
  reducedSignals: string[];
  detectedSignals: Signal[];
  improvedSkills: string[];
  recommendation?: { recommendedAction: string } | null;
}) {
  if (index === 0) {
    if (detectedSignals.length) return `Baseline activity collected ${avgAccuracy}% accuracy evidence and detected ${detectedSignals.length} misconception signal${detectedSignals.length === 1 ? "" : "s"}. The next action is ${recommendation?.recommendedAction ?? "being determined"}.`;
    return `Baseline activity collected ${avgAccuracy}% accuracy evidence with no strong misconception signal in this attempt. The next action is ${recommendation?.recommendedAction ?? "being determined"}.`;
  }
  if (avgAccuracy === 100 && reducedSignals.length) return `Corrective evidence: this activity was 100% correct and reduced ${reducedSignals.length} earlier misconception signal${reducedSignals.length === 1 ? "" : "s"}. Retention still needs delayed review before permanent mastery is claimed.`;
  if (improvedSkills.length) return `This attempt improved evidence for ${improvedSkills.length} skill${improvedSkills.length === 1 ? "" : "s"}. Average explanation evidence is ${avgExplanation}% and transfer evidence is ${avgTransfer}%.`;
  if (detectedSignals.length) return `This attempt still shows ${detectedSignals.length} misconception signal${detectedSignals.length === 1 ? "" : "s"}. The platform should repair the concept before adding harder work.`;
  return `This attempt added fresh evidence. Current recommendation is ${recommendation?.recommendedAction ?? "being determined"}.`;
}

export async function getTimelineState() {
  const student = await ensureSeedData();
  const [events, recommendations] = await Promise.all([
    loadTimelineEvents(student.id),
    prisma.studentRecommendation.findMany({ where: { studentId: student.id }, orderBy: { generatedAt: "asc" } }),
  ]);

  const grouped = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    if (!event.assessmentAttemptId) continue;
    const attemptEvents = grouped.get(event.assessmentAttemptId) ?? [];
    attemptEvents.push(event);
    grouped.set(event.assessmentAttemptId, attemptEvents);
  }

  const rawAttempts = [...grouped.entries()]
    .map(([attemptId, attemptEvents]) => {
      const sorted = attemptEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const createdAt = sorted[0]?.createdAt ?? new Date(0);
      const latestAt = sorted[sorted.length - 1]?.createdAt ?? createdAt;
      return { attemptId, events: sorted, createdAt, latestAt };
    })
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const attempts = rawAttempts.map((attempt, index) => {
    const previous = rawAttempts[index - 1];
    const activityType = attempt.events.some((event) => event.eventType === "Daily Practice") ? "Daily Practice" : attempt.events.some((event) => event.eventType === "Retention Practice") ? "Retention Practice" : attempt.events.some((event) => event.eventType === "Next Best Action") ? "Next Best Action" : "Diagnostic Assessment";
    const previousSignals = previous ? signalMap(previous.events) : new Map<string, Signal & { count: number }>();
    const currentSignals = signalMap(attempt.events);
    const detectedSignals = [...currentSignals.values()].sort((a, b) => b.weight - a.weight);
    const reducedSignals = [...previousSignals.keys()].filter((id) => !currentSignals.has(id));
    const persistentSignals = [...currentSignals.keys()].filter((id) => previousSignals.has(id));
    const newSignals = [...currentSignals.keys()].filter((id) => !previousSignals.has(id));

    const previousSkillEvents = new Map(previous?.events.map((event) => [event.skillNodeId, event]) ?? []);
    const skillChanges = attempt.events.map((event) => {
      const previousEvent = previousSkillEvents.get(event.skillNodeId);
      const accuracyDelta = scoreDelta(event.correctness, previousEvent?.correctness);
      const explanationDelta = scoreDelta(event.explanationScore, previousEvent?.explanationScore);
      const transferDelta = scoreDelta(event.transferScore, previousEvent?.transferScore);
      const corrected = (previousEvent?.correctness ?? 100) < 100 && event.correctness === 100;
      const declined = previousEvent !== undefined && previousEvent.correctness === 100 && event.correctness < 100;
      return {
        skillNodeId: event.skillNodeId,
        microSkill: event.skill.microSkill,
        correctness: Math.round(event.correctness),
        explanationScore: Math.round(event.explanationScore),
        transferScore: Math.round(event.transferScore),
        accuracyDelta,
        explanationDelta,
        transferDelta,
        corrected,
        declined,
        signals: safeSignals(event.misconceptionSignals),
      };
    });
    const improvedSkills = skillChanges.filter((skill) => skill.corrected || (skill.accuracyDelta ?? 0) > 0 || (skill.explanationDelta ?? 0) >= 20).map((skill) => skill.skillNodeId);
    const declinedSkills = skillChanges.filter((skill) => skill.declined || (skill.accuracyDelta ?? 0) < 0).map((skill) => skill.skillNodeId);

    const recommendation = recommendations.find((item) => item.generatedAt.getTime() >= attempt.latestAt.getTime() - 1000) ?? null;
    const avgAccuracy = avg(attempt.events.map((event) => event.correctness));
    const avgExplanation = avg(attempt.events.map((event) => event.explanationScore));
    const avgTransfer = avg(attempt.events.map((event) => event.transferScore));
    const avgRetention = avg(attempt.events.map((event) => event.retentionSignal));
    const avgConfidenceCalibration = avg(attempt.events.map((event) => event.confidenceCalibration));
    const representationUse = Math.round((attempt.events.filter((event) => event.representationChoice && event.representationChoice !== "none").length / Math.max(1, attempt.events.length)) * 100);
    const previousAttempt = previous
      ? {
          avgAccuracy: avg(previous.events.map((event) => event.correctness)),
          avgExplanation: avg(previous.events.map((event) => event.explanationScore)),
          avgTransfer: avg(previous.events.map((event) => event.transferScore)),
        }
      : null;

    return {
      attemptId: attempt.attemptId,
      activityType,
      createdAt: attempt.createdAt,
      evidenceCount: attempt.events.length,
      avgAccuracy,
      avgExplanation,
      avgTransfer,
      avgRetention,
      avgConfidenceCalibration,
      representationUse,
      detectedSignals,
      reducedSignals,
      persistentSignals,
      newSignals,
      skillChanges,
      improvedSkills,
      declinedSkills,
      recommendation,
      comparison: {
        accuracyDelta: scoreDelta(avgAccuracy, previousAttempt?.avgAccuracy),
        explanationDelta: scoreDelta(avgExplanation, previousAttempt?.avgExplanation),
        transferDelta: scoreDelta(avgTransfer, previousAttempt?.avgTransfer),
      },
      parentSummary: summarizeAttempt({ index, avgAccuracy, avgExplanation, avgTransfer, reducedSignals, detectedSignals, improvedSkills, recommendation }),
      changeBullets: [
        deltaLabel(scoreDelta(avgAccuracy, previousAttempt?.avgAccuracy), "Accuracy"),
        deltaLabel(scoreDelta(avgExplanation, previousAttempt?.avgExplanation), "Explanation"),
        deltaLabel(scoreDelta(avgTransfer, previousAttempt?.avgTransfer), "Transfer"),
      ],
    };
  });

  return {
    student,
    attempts: attempts.reverse(),
    totalAttempts: attempts.length,
    latestAttempt: attempts[0] ?? null,
  };
}