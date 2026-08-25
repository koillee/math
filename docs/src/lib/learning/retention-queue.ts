import type { MathItem, SkillGraph, StudentMastery, StudentMisconception, StudentRecommendation } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "./seed";

type MasteryWithSkill = StudentMastery & { skill: SkillGraph };
type ItemWithSkill = MathItem & { skill: SkillGraph };
type MisconceptionWithMeta = StudentMisconception & { misconception: { name: string; relatedSkillIds: unknown } };

type RecentEvidence = {
  skillNodeId: string;
  itemId: string | null;
  eventType: string;
  correctness: number;
  explanationScore: number;
  representationScore: number;
  retentionSignal: number;
  confidenceCalibration: number;
  createdAt: Date;
};

export type RetentionStatus = "Due now" | "Due soon" | "Stable" | "Needs more evidence";

export type RetentionQueueEntry = {
  skillNodeId: string;
  skillName: string;
  strand: string;
  subskill: string;
  masteryLevel: number;
  aiState: string;
  masteryEstimate: number;
  retentionScore: number;
  misconceptionRiskScore: number;
  evidenceCount: number;
  status: RetentionStatus;
  reason: string;
  reasons: string[];
  lastPracticedAt: Date | null;
  nextReviewDueAt: Date | null;
  suggestedTiming: string;
  selectedItem: ItemWithSkill | null;
  itemPriorUseCount: number;
  relatedMisconceptions: { id: string; name: string; probability: number; status: string }[];
  latestEvidence: RecentEvidence | null;
  priorityScore: number;
};

export type RetentionQueueState = {
  studentId: string;
  generatedAt: Date;
  activeRecommendation: StudentRecommendation | null;
  entries: RetentionQueueEntry[];
  sections: Record<RetentionStatus, RetentionQueueEntry[]>;
  counts: Record<RetentionStatus, number>;
  topDueEntry: RetentionQueueEntry | null;
  summary: string;
};

const statuses: RetentionStatus[] = ["Due now", "Due soon", "Stable", "Needs more evidence"];

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function retentionMisconceptionIds(value: unknown): string[] {
  return stringArray(value);
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueDate(date: Date | null, now: Date) {
  if (!date) return null;
  const days = daysBetween(now, date);
  if (days < 0) return `review date passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "review date is today";
  if (days === 1) return "review date is tomorrow";
  return `review date is in ${days} days`;
}

function relatedMisconceptionsForSkill(skillNodeId: string, misconceptions: MisconceptionWithMeta[]) {
  return misconceptions
    .filter((misconception) => stringArray(misconception.misconception.relatedSkillIds).includes(skillNodeId))
    .map((misconception) => ({
      id: misconception.misconceptionId,
      name: misconception.misconception.name,
      probability: Math.round(misconception.probability),
      status: misconception.status,
    }))
    .sort((a, b) => b.probability - a.probability);
}

async function itemUseCountById(studentId: string, itemIds: string[]) {
  if (itemIds.length === 0) return new Map<string, number>();
  const counts = await prisma.evidenceEvent.groupBy({
    by: ["itemId"],
    where: { studentId, itemId: { in: itemIds } },
    _count: { itemId: true },
  });
  return new Map(counts.flatMap((count) => (count.itemId ? [[count.itemId, count._count.itemId]] : [])));
}

function selectReviewItem({ skillNodeId, reviewItems, useCounts }: { skillNodeId: string; reviewItems: ItemWithSkill[]; useCounts: Map<string, number> }) {
  const candidates = reviewItems
    .filter((item) => item.skillNodeId === skillNodeId)
    .sort((a, b) => {
      const typeRank = (item: ItemWithSkill) => (item.itemType === "Retention" ? 0 : item.itemType === "Review" ? 1 : 2);
      return typeRank(a) - typeRank(b) || (useCounts.get(a.itemId) ?? 0) - (useCounts.get(b.itemId) ?? 0) || a.sequence - b.sequence || a.itemId.localeCompare(b.itemId);
    });
  const selected = candidates[0] ?? null;
  return { selectedItem: selected, itemPriorUseCount: selected ? (useCounts.get(selected.itemId) ?? 0) : 0 };
}

function classifyRetention({ mastery, relatedMisconceptions, latestEvidence, now }: { mastery: MasteryWithSkill; relatedMisconceptions: ReturnType<typeof relatedMisconceptionsForSkill>; latestEvidence: RecentEvidence | null; now: Date }) {
  const reasons: string[] = [];
  const dueCopy = formatDueDate(mastery.nextReviewDueAt, now);
  const daysSincePractice = mastery.lastEvidenceAt ? daysBetween(mastery.lastEvidenceAt, now) : null;

  if (mastery.evidenceCount === 0) {
    return {
      status: "Needs more evidence" as const,
      reasons: ["This skill has not received direct evidence yet."],
      suggestedTiming: "Collect evidence through a diagnostic or a future targeted activity.",
      priorityScore: 5,
    };
  }

  if (mastery.retentionScore < 55) reasons.push(`Retention estimate is ${Math.round(mastery.retentionScore)}%, so the skill may fade without a short check.`);
  if (mastery.nextReviewDueAt && mastery.nextReviewDueAt <= now) reasons.push(`The ${dueCopy}.`);
  if (mastery.misconceptionRiskScore >= 60 || relatedMisconceptions.some((m) => m.probability >= 60)) reasons.push("A likely misconception is still being monitored for this skill.");
  if (latestEvidence && latestEvidence.correctness < 100) reasons.push("The most recent evidence was not fully correct.");
  if (mastery.confidenceCalibrationScore < 45) reasons.push("Confidence and correctness are not yet well matched.");
  if (daysSincePractice !== null && daysSincePractice >= 14 && mastery.retentionScore < 75) reasons.push(`This skill has not been checked for ${daysSincePractice} days.`);

  if (reasons.length > 0) {
    return {
      status: "Due now" as const,
      reasons,
      suggestedTiming: "Review now or in the next short maths session.",
      priorityScore: 90 + reasons.length * 5 + Math.max(0, 70 - mastery.retentionScore) + Math.max(0, mastery.misconceptionRiskScore - 35),
    };
  }

  if (mastery.retentionScore < 70) reasons.push(`Retention is maintaining but still below 70% (${Math.round(mastery.retentionScore)}%).`);
  if (mastery.masteryLevel < 3) reasons.push("The skill is still in practice mode, so a near-term review is useful.");
  if (mastery.explanationScore < 60) reasons.push("Explanation evidence is still developing.");
  if (mastery.representationScore < 60) reasons.push("Representation evidence is still developing.");
  if (mastery.misconceptionRiskScore >= 35 || relatedMisconceptions.some((m) => m.probability >= 35)) reasons.push("There is a possible misconception signal to monitor.");
  if (mastery.nextReviewDueAt && daysBetween(now, mastery.nextReviewDueAt) <= 7) reasons.push(`The ${dueCopy}.`);

  if (reasons.length > 0) {
    return {
      status: "Due soon" as const,
      reasons,
      suggestedTiming: "Review in the next 3–7 days.",
      priorityScore: 55 + reasons.length * 4 + Math.max(0, 70 - mastery.retentionScore),
    };
  }

  return {
    status: "Stable" as const,
    reasons: ["Recent evidence is strong enough that this skill can wait while weaker skills are reviewed first."],
    suggestedTiming: mastery.nextReviewDueAt ? `Leave for now; ${dueCopy}.` : "Leave for now; recheck after more activity.",
    priorityScore: Math.max(10, 45 - mastery.retentionScore / 3),
  };
}

function plainSummary(counts: Record<RetentionStatus, number>) {
  if (counts["Due now"] > 0) return `${counts["Due now"]} skill${counts["Due now"] === 1 ? "" : "s"} should be reviewed now before the learning fades.`;
  if (counts["Due soon"] > 0) return `${counts["Due soon"]} skill${counts["Due soon"] === 1 ? "" : "s"} should be checked soon, while stronger skills can wait.`;
  if (counts.Stable > 0) return "The assessed skills look stable for now. Keep collecting evidence through short activities.";
  return "The queue needs diagnostic evidence before it can decide what to review.";
}

export async function getRetentionQueueState(): Promise<RetentionQueueState> {
  const student = await ensureSeedData();
  return getRetentionQueueStateForStudent(student.id);
}

export async function getRetentionQueueStateForStudent(studentId: string): Promise<RetentionQueueState> {
  const now = new Date();
  const [mastery, misconceptions, latestEvents, reviewItems, activeRecommendation] = await Promise.all([
    prisma.studentMastery.findMany({ where: { studentId }, include: { skill: true }, orderBy: [{ skillNodeId: "asc" }] }),
    prisma.studentMisconception.findMany({ where: { studentId }, include: { misconception: { select: { name: true, relatedSkillIds: true } } }, orderBy: { probability: "desc" } }),
    prisma.evidenceEvent.findMany({
      where: { studentId },
      select: { skillNodeId: true, itemId: true, eventType: true, correctness: true, explanationScore: true, representationScore: true, retentionSignal: true, confidenceCalibration: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.mathItem.findMany({
      where: { active: true, subject: "Mathematics", yearGroup: "Year 6", itemType: { in: ["Retention", "Review"] } },
      include: { skill: true },
      orderBy: [{ itemType: "desc" }, { sequence: "asc" }, { itemId: "asc" }],
    }),
    prisma.studentRecommendation.findFirst({ where: { studentId, status: "active" }, orderBy: { generatedAt: "desc" } }),
  ]);

  const latestBySkill = new Map<string, RecentEvidence>();
  for (const event of latestEvents) {
    if (!latestBySkill.has(event.skillNodeId)) latestBySkill.set(event.skillNodeId, event);
  }

  const useCounts = await itemUseCountById(studentId, reviewItems.map((item) => item.itemId));

  const entries = mastery
    .map((m) => {
      const relatedMisconceptions = relatedMisconceptionsForSkill(m.skillNodeId, misconceptions);
      const latestEvidence = latestBySkill.get(m.skillNodeId) ?? null;
      const classification = classifyRetention({ mastery: m, relatedMisconceptions, latestEvidence, now });
      const selected = selectReviewItem({ skillNodeId: m.skillNodeId, reviewItems, useCounts });
      const masteryEstimate = Math.round((m.accuracyScore + m.explanationScore + m.representationScore + m.retentionScore) / 4);
      return {
        skillNodeId: m.skillNodeId,
        skillName: m.skill.microSkill,
        strand: m.skill.strand,
        subskill: m.skill.subskill,
        masteryLevel: m.masteryLevel,
        aiState: m.aiState,
        masteryEstimate,
        retentionScore: Math.round(m.retentionScore),
        misconceptionRiskScore: Math.round(m.misconceptionRiskScore),
        evidenceCount: m.evidenceCount,
        status: classification.status,
        reason: classification.reasons[0],
        reasons: classification.reasons,
        lastPracticedAt: m.lastEvidenceAt,
        nextReviewDueAt: m.nextReviewDueAt,
        suggestedTiming: classification.suggestedTiming,
        selectedItem: selected.selectedItem,
        itemPriorUseCount: selected.itemPriorUseCount,
        relatedMisconceptions,
        latestEvidence,
        priorityScore: classification.priorityScore,
      } satisfies RetentionQueueEntry;
    })
    .sort((a, b) => {
      const statusRank = (entry: RetentionQueueEntry) => statuses.indexOf(entry.status);
      return statusRank(a) - statusRank(b) || b.priorityScore - a.priorityScore || a.skillNodeId.localeCompare(b.skillNodeId);
    });

  const sections = Object.fromEntries(statuses.map((status) => [status, entries.filter((entry) => entry.status === status)])) as Record<RetentionStatus, RetentionQueueEntry[]>;
  const counts = Object.fromEntries(statuses.map((status) => [status, sections[status].length])) as Record<RetentionStatus, number>;
  const topDueEntry = [...sections["Due now"], ...sections["Due soon"]].find((entry) => entry.selectedItem) ?? sections["Due now"][0] ?? sections["Due soon"][0] ?? null;

  return {
    studentId,
    generatedAt: now,
    activeRecommendation,
    entries,
    sections,
    counts,
    topDueEntry,
    summary: plainSummary(counts),
  };
}

export async function buildRetentionReportSnapshot(studentId: string) {
  const state = await getRetentionQueueStateForStudent(studentId);
  const latestDailyPractice = await prisma.dailyPracticeSession.findFirst({
    where: { studentId, status: "completed" },
    orderBy: [{ completedAt: "desc" }, { generatedAt: "desc" }],
  });
  const topEntries = [...state.sections["Due now"], ...state.sections["Due soon"]].slice(0, 4);
  return {
    summary: state.summary,
    dueNowCount: state.counts["Due now"],
    dueSoonCount: state.counts["Due soon"],
    stableCount: state.counts.Stable,
    needsMoreEvidenceCount: state.counts["Needs more evidence"],
    topReviewSkill: state.topDueEntry?.skillName ?? null,
    topReviewItemId: state.topDueEntry?.selectedItem?.itemId ?? null,
    topReviewItemTitle: state.topDueEntry?.selectedItem?.title ?? null,
    dueNow: state.sections["Due now"].slice(0, 4).map((entry) => `${entry.skillName}: ${entry.reason}`),
    dueSoon: state.sections["Due soon"].slice(0, 4).map((entry) => `${entry.skillName}: ${entry.reason}`),
    stable: state.sections.Stable.slice(0, 4).map((entry) => entry.skillName),
    latestDailyPractice: latestDailyPractice ? { practiceDate: latestDailyPractice.practiceDate, summary: latestDailyPractice.summary, completedAt: latestDailyPractice.completedAt } : null,
    suggestedHomeSupport: topEntries.length
      ? `Start with ${topEntries[0].skillName}. Keep it short: one review item, one explanation, and a confidence rating.`
      : latestDailyPractice?.summary ?? "No urgent review is currently identified. Keep using short diagnostics or targeted activities to collect evidence.",
  };
}
