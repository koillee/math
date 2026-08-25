import type { MathItem, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { misconceptions } from "./data";
import { gradeItemBankItem, masteryLevelFromScores, misconceptionStatus, nextReviewDate, recommendationCopy } from "./engine";
import { buildRetentionReportSnapshot } from "./retention-queue";
import { ensureSeedData } from "./seed";
import { dailyPracticeAttemptId } from "./todays-practice";

export type DiagnosticSubmission = Record<string, { answer: string; explanation: string; representation: string; confidence: number; timeOnTaskSeconds?: number }>;
export type DiagnosticProcessOptions = { attemptId?: string };
export type LearningActivityProcessOptions = DiagnosticProcessOptions & { eventType?: "Next Best Action" | "Retention Practice" | "Daily Practice" };
export type LearningActivitySubmission = DiagnosticSubmission[string];
export type DailyPracticeSubmission = Record<string, LearningActivitySubmission>;

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const misconceptionMeta = new Map(misconceptions.map((m) => [m[0], { id: m[0], name: m[1], relatedSkillIds: m[3] as readonly string[], severity: m[9] }]));

function relatedMisconceptionIdsForSkill(skillNodeId: string) {
  return [...misconceptionMeta.values()].filter((m) => m.relatedSkillIds.includes(skillNodeId)).map((m) => m.id);
}

function recentWeightedScore<T>(events: T[], score: (event: T) => number) {
  if (events.length === 0) return 0;
  const historicalAverage = avg(events.map(score));
  const latestScore = score(events[0]);
  return Math.round(latestScore * 0.72 + historicalAverage * 0.28);
}

function misconceptionReductionForCorrectEvidence(event: { correctness: number; explanationScore: number; representationScore: number; confidenceCalibration: number }) {
  if (event.correctness < 100) return 0;
  return Math.min(46, 22 + (event.explanationScore >= 80 ? 14 : event.explanationScore >= 55 ? 9 : 4) + (event.representationScore >= 70 ? 5 : 0) + (event.confidenceCalibration >= 75 ? 3 : 0));
}

async function persistEvidenceAndRefreshProfile({
  studentId,
  evidenceEvents,
  touchedSkills,
  touchedMisconceptions,
  misconceptionUpdates,
  misconceptionCounterEvidence,
}: {
  studentId: string;
  evidenceEvents: Prisma.EvidenceEventCreateManyInput[];
  touchedSkills: Set<string>;
  touchedMisconceptions: Set<string>;
  misconceptionUpdates: { id: string; weight: number }[];
  misconceptionCounterEvidence: { id: string; reduction: number }[];
}) {
  const evidenceCreateResult = await prisma.evidenceEvent.createMany({ data: evidenceEvents, skipDuplicates: true });
  if (evidenceCreateResult.count === 0) {
    const recommendation = await prisma.studentRecommendation.findFirst({
      where: { studentId, status: "active" },
      orderBy: { generatedAt: "desc" },
    });
    return { studentId, touchedSkills: [], touchedMisconceptions: [], recommendation, duplicateAttempt: true };
  }

  for (const signal of misconceptionUpdates) {
    const existing = await prisma.studentMisconception.findUnique({ where: { studentId_misconceptionId: { studentId, misconceptionId: signal.id } } });
    const probability = Math.min(100, Math.round((existing?.probability ?? 0) + signal.weight));
    const status = misconceptionStatus(probability);
    await prisma.studentMisconception.upsert({
      where: { studentId_misconceptionId: { studentId, misconceptionId: signal.id } },
      create: { studentId, misconceptionId: signal.id, probability, status, evidenceCount: 1, firstDetectedAt: new Date(), lastDetectedAt: new Date(), verificationCount: probability >= 60 ? 1 : 0, modelConfidence: 70 },
      update: { probability, status, evidenceCount: { increment: 1 }, lastDetectedAt: new Date(), verificationCount: probability >= 60 ? { increment: 1 } : undefined, modelConfidence: 76 },
    });
  }

  for (const counterEvidence of misconceptionCounterEvidence) {
    const existing = await prisma.studentMisconception.findUnique({ where: { studentId_misconceptionId: { studentId, misconceptionId: counterEvidence.id } } });
    if (!existing) continue;
    const probability = Math.max(0, Math.round(existing.probability - counterEvidence.reduction));
    const status = misconceptionStatus(probability);
    await prisma.studentMisconception.update({
      where: { studentId_misconceptionId: { studentId, misconceptionId: counterEvidence.id } },
      data: {
        probability,
        status,
        resolvedAt: probability < 20 ? new Date() : null,
        modelConfidence: Math.max(35, existing.modelConfidence - 8),
      },
    });
  }

  for (const skillNodeId of touchedSkills) {
    const events = await prisma.evidenceEvent.findMany({ where: { studentId, skillNodeId }, orderBy: { createdAt: "desc" } });
    const accuracyScore = recentWeightedScore(events, (e) => e.correctness);
    const explanationScore = recentWeightedScore(events, (e) => e.explanationScore);
    const representationScore = recentWeightedScore(events, (e) => e.representationScore);
    const transferScore = recentWeightedScore(events, (e) => e.transferScore);
    const retentionScore = recentWeightedScore(events, (e) => e.retentionSignal);
    const confidenceCalibrationScore = recentWeightedScore(events, (e) => e.confidenceCalibration);
    const hintIndependenceScore = avg(events.map((e) => Math.max(0, 100 - e.maxHintLevel * 20 - e.hintCount * 10)));
    const categories = new Set(events.map((e) => e.evidenceCategory));
    const relatedMisconceptionIds = relatedMisconceptionIdsForSkill(skillNodeId);
    const activeMis = relatedMisconceptionIds.length ? await prisma.studentMisconception.findMany({ where: { studentId, misconceptionId: { in: relatedMisconceptionIds } } }) : [];
    const misconceptionRiskScore = activeMis.length ? Math.max(...activeMis.map((m) => m.probability)) : 0;
    const result = masteryLevelFromScores({ accuracyScore, explanationScore, representationScore, transferScore, retentionScore, misconceptionRiskScore, evidenceCount: events.length });
    const latest = events[0];
    const whyThisStatus = `${result.state}: recent-weighted accuracy ${accuracyScore}, explanation ${explanationScore}, transfer ${transferScore}, retention ${retentionScore}. Latest evidence was ${Math.round(latest.correctness)}% correct. ${misconceptionRiskScore >= 35 ? "A misconception signal is still being monitored, but correct counter-evidence now reduces its probability." : "No strong misconception signal currently blocks progress."}`;
    await prisma.studentMastery.upsert({
      where: { studentId_skillNodeId: { studentId, skillNodeId } },
      create: { studentId, skillNodeId, masteryLevel: result.level, aiState: result.state, accuracyScore, fluencyScore: Math.round((accuracyScore + hintIndependenceScore) / 2), representationScore, explanationScore, transferScore, retentionScore, hintIndependenceScore, confidenceCalibrationScore, misconceptionRiskScore, evidenceCount: events.length, evidenceDiversity: categories.size * 20, modelConfidence: Math.min(95, 40 + events.length * 10 + categories.size * 5), whyThisStatus, lastEvidenceAt: new Date(), nextReviewDueAt: nextReviewDate(retentionScore) },
      update: { masteryLevel: result.level, aiState: result.state, accuracyScore, fluencyScore: Math.round((accuracyScore + hintIndependenceScore) / 2), representationScore, explanationScore, transferScore, retentionScore, hintIndependenceScore, confidenceCalibrationScore, misconceptionRiskScore, evidenceCount: events.length, evidenceDiversity: categories.size * 20, modelConfidence: Math.min(95, 40 + events.length * 10 + categories.size * 5), whyThisStatus, lastEvidenceAt: new Date(), nextReviewDueAt: nextReviewDate(retentionScore) },
    });
  }

  const recommendation = await generateRecommendationAndReport(studentId, touchedMisconceptions);
  return { studentId, touchedSkills: [...touchedSkills], touchedMisconceptions: [...touchedMisconceptions], recommendation };
}

function buildItemEvidence({ item, input, grade, studentId, attemptId, eventType }: { item: Pick<MathItem, "itemId" | "skillNodeId" | "evidenceCategory" | "prompt" | "evidenceWeight">; input: LearningActivitySubmission; grade: ReturnType<typeof gradeItemBankItem>; studentId: string; attemptId: string; eventType: string }): Prisma.EvidenceEventCreateManyInput {
  const calculatedEvidenceWeight = Math.round((grade.correctness > 0 ? 60 : 35) + grade.explanationScore / 5 + (grade.misconceptionSignals.length ? 10 : 0));
  const evidenceWeight = Math.max(calculatedEvidenceWeight, Math.round(item.evidenceWeight));
  return {
    assessmentAttemptId: attemptId,
    itemId: item.itemId,
    studentId,
    skillNodeId: item.skillNodeId,
    eventType,
    evidenceCategory: item.evidenceCategory,
    prompt: item.prompt,
    response: input.answer,
    explanation: input.explanation,
    representationChoice: input.representation,
    correctness: grade.correctness,
    explanationScore: grade.explanationScore,
    representationScore: grade.representationScore,
    transferScore: grade.transferScore,
    retentionSignal: grade.retentionSignal,
    hintCount: 0,
    maxHintLevel: 0,
    confidenceRating: input.confidence,
    confidenceCalibration: grade.confidenceCalibration,
    timeOnTaskSeconds: input.timeOnTaskSeconds ?? 45,
    errorPattern: grade.errorPattern as Prisma.InputJsonValue,
    misconceptionSignals: grade.misconceptionSignals as unknown as Prisma.InputJsonValue,
    evidenceWeight,
    modelConfidence: grade.misconceptionSignals.length ? 78 : 65,
  };
}

export async function processDiagnosticSubmission(submission: DiagnosticSubmission, options: DiagnosticProcessOptions = {}) {
  const student = await ensureSeedData();
  const diagnosticItems = await prisma.mathItem.findMany({
    where: { subject: "Mathematics", yearGroup: "Year 6", itemType: "Diagnostic", active: true },
    orderBy: [{ sequence: "asc" }, { itemId: "asc" }],
  });
  if (diagnosticItems.length === 0) throw new Error("No active diagnostic items are available in the item bank.");
  const touchedSkills = new Set<string>();
  const touchedMisconceptions = new Set<string>();
  const attemptId = options.attemptId?.trim() || `server-${randomUUID()}`;

  const existingAttemptEvidence = await prisma.evidenceEvent.count({
    where: { studentId: student.id, assessmentAttemptId: attemptId },
  });
  if (existingAttemptEvidence > 0) {
    const recommendation = await prisma.studentRecommendation.findFirst({
      where: { studentId: student.id, status: "active" },
      orderBy: { generatedAt: "desc" },
    });
    return { studentId: student.id, touchedSkills: [], touchedMisconceptions: [], recommendation, duplicateAttempt: true };
  }

  const evidenceEvents: Prisma.EvidenceEventCreateManyInput[] = [];
  const misconceptionUpdates: { id: string; weight: number }[] = [];
  const misconceptionCounterEvidence: { id: string; reduction: number }[] = [];

  for (const item of diagnosticItems) {
    const input = submission[item.itemId] ?? { answer: "", explanation: "", representation: "none", confidence: 3, timeOnTaskSeconds: 45 };
    const grade = gradeItemBankItem(item, input.answer, input.explanation, input.confidence, input.representation);
    const calculatedEvidenceWeight = Math.round((grade.correctness > 0 ? 60 : 35) + grade.explanationScore / 5 + (grade.misconceptionSignals.length ? 10 : 0));
    const evidenceWeight = Math.max(calculatedEvidenceWeight, Math.round(item.evidenceWeight));
    evidenceEvents.push({
      assessmentAttemptId: attemptId,
      itemId: item.itemId,
      studentId: student.id,
      skillNodeId: item.skillNodeId,
      eventType: "Diagnostic Assessment",
      evidenceCategory: item.evidenceCategory,
      prompt: item.prompt,
      response: input.answer,
      explanation: input.explanation,
      representationChoice: input.representation,
      correctness: grade.correctness,
      explanationScore: grade.explanationScore,
      representationScore: grade.representationScore,
      transferScore: grade.transferScore,
      retentionSignal: grade.retentionSignal,
      hintCount: 0,
      maxHintLevel: 0,
      confidenceRating: input.confidence,
      confidenceCalibration: grade.confidenceCalibration,
      timeOnTaskSeconds: input.timeOnTaskSeconds ?? 45,
      errorPattern: grade.errorPattern as Prisma.InputJsonValue,
      misconceptionSignals: grade.misconceptionSignals as unknown as Prisma.InputJsonValue,
      evidenceWeight,
      modelConfidence: grade.misconceptionSignals.length ? 78 : 65,
    });
    touchedSkills.add(item.skillNodeId);

    for (const signal of grade.misconceptionSignals) {
      touchedMisconceptions.add(signal.id);
      misconceptionUpdates.push({ id: signal.id, weight: signal.weight });
    }

    const signaledIds = new Set(grade.misconceptionSignals.map((signal) => signal.id));
    const reduction = misconceptionReductionForCorrectEvidence({ correctness: grade.correctness, explanationScore: grade.explanationScore, representationScore: grade.representationScore, confidenceCalibration: grade.confidenceCalibration });
    if (reduction > 0) {
      for (const misconceptionId of relatedMisconceptionIdsForSkill(item.skillNodeId)) {
        if (!signaledIds.has(misconceptionId)) misconceptionCounterEvidence.push({ id: misconceptionId, reduction });
      }
    }
  }

  return persistEvidenceAndRefreshProfile({
    studentId: student.id,
    evidenceEvents,
    touchedSkills,
    touchedMisconceptions,
    misconceptionUpdates,
    misconceptionCounterEvidence,
  });
}

export async function processNextActionSubmission(itemId: string, input: LearningActivitySubmission, options: LearningActivityProcessOptions = {}) {
  const student = await ensureSeedData();
  const item = await prisma.mathItem.findUnique({ where: { itemId } });
  if (!item || !item.active) throw new Error("The selected next activity is no longer available.");

  const attemptId = options.attemptId?.trim() || `next-action-${randomUUID()}`;
  const existingAttemptEvidence = await prisma.evidenceEvent.count({ where: { studentId: student.id, assessmentAttemptId: attemptId } });
  if (existingAttemptEvidence > 0) {
    const recommendation = await prisma.studentRecommendation.findFirst({
      where: { studentId: student.id, status: "active" },
      orderBy: { generatedAt: "desc" },
    });
    return { studentId: student.id, touchedSkills: [], touchedMisconceptions: [], recommendation, duplicateAttempt: true };
  }

  const grade = gradeItemBankItem(item, input.answer, input.explanation, input.confidence, input.representation);
  const eventType = options.eventType ?? "Next Best Action";
  const evidenceEvents = [buildItemEvidence({ item, input, grade, studentId: student.id, attemptId, eventType })];
  const touchedSkills = new Set([item.skillNodeId]);
  const touchedMisconceptions = new Set<string>();
  const misconceptionUpdates: { id: string; weight: number }[] = [];
  const misconceptionCounterEvidence: { id: string; reduction: number }[] = [];

  for (const signal of grade.misconceptionSignals) {
    touchedMisconceptions.add(signal.id);
    misconceptionUpdates.push({ id: signal.id, weight: signal.weight });
  }

  const signaledIds = new Set(grade.misconceptionSignals.map((signal) => signal.id));
  const reduction = misconceptionReductionForCorrectEvidence({ correctness: grade.correctness, explanationScore: grade.explanationScore, representationScore: grade.representationScore, confidenceCalibration: grade.confidenceCalibration });
  if (reduction > 0) {
    for (const misconceptionId of relatedMisconceptionIdsForSkill(item.skillNodeId)) {
      if (!signaledIds.has(misconceptionId)) misconceptionCounterEvidence.push({ id: misconceptionId, reduction });
    }
  }

  return persistEvidenceAndRefreshProfile({
    studentId: student.id,
    evidenceEvents,
    touchedSkills,
    touchedMisconceptions,
    misconceptionUpdates,
    misconceptionCounterEvidence,
  });
}

export async function processDailyPracticeSubmission(sessionId: string, submission: DailyPracticeSubmission, options: DiagnosticProcessOptions = {}) {
  const student = await ensureSeedData();
  const session = await prisma.dailyPracticeSession.findUnique({
    where: { id: sessionId },
    include: { items: { include: { item: true }, orderBy: { position: "asc" } } },
  });
  if (!session || session.studentId !== student.id) throw new Error("Today's practice session could not be found.");
  if (session.items.length === 0) throw new Error("Today's practice session has no selected items.");

  const attemptId = options.attemptId?.trim() || dailyPracticeAttemptId(session);
  const existingAttemptEvidence = await prisma.evidenceEvent.count({ where: { studentId: student.id, assessmentAttemptId: attemptId } });
  if (existingAttemptEvidence > 0 || session.status === "completed") {
    const recommendation = await prisma.studentRecommendation.findFirst({
      where: { studentId: student.id, status: "active" },
      orderBy: { generatedAt: "desc" },
    });
    return { studentId: student.id, touchedSkills: [], touchedMisconceptions: [], recommendation, duplicateAttempt: true, correctCount: 0, totalCount: session.items.length, skillsPractised: [] };
  }

  const evidenceEvents: Prisma.EvidenceEventCreateManyInput[] = [];
  const touchedSkills = new Set<string>();
  const touchedMisconceptions = new Set<string>();
  const misconceptionUpdates: { id: string; weight: number }[] = [];
  const misconceptionCounterEvidence: { id: string; reduction: number }[] = [];
  let correctCount = 0;

  for (const sessionItem of session.items) {
    const item = sessionItem.item;
    const input = submission[item.itemId] ?? { answer: "", explanation: "", representation: "none", confidence: 3, timeOnTaskSeconds: 45 };
    const grade = gradeItemBankItem(item, input.answer, input.explanation, input.confidence, input.representation);
    if (grade.correctness === 100) correctCount += 1;
    evidenceEvents.push(buildItemEvidence({ item, input, grade, studentId: student.id, attemptId, eventType: "Daily Practice" }));
    touchedSkills.add(item.skillNodeId);

    for (const signal of grade.misconceptionSignals) {
      touchedMisconceptions.add(signal.id);
      misconceptionUpdates.push({ id: signal.id, weight: signal.weight });
    }

    const signaledIds = new Set(grade.misconceptionSignals.map((signal) => signal.id));
    const reduction = misconceptionReductionForCorrectEvidence({ correctness: grade.correctness, explanationScore: grade.explanationScore, representationScore: grade.representationScore, confidenceCalibration: grade.confidenceCalibration });
    if (reduction > 0) {
      for (const misconceptionId of relatedMisconceptionIdsForSkill(item.skillNodeId)) {
        if (!signaledIds.has(misconceptionId)) misconceptionCounterEvidence.push({ id: misconceptionId, reduction });
      }
    }
  }

  const skillsPractised = [...touchedSkills];
  const summary = `Today's practice complete: ${correctCount}/${session.items.length} correct across ${skillsPractised.length} skill${skillsPractised.length === 1 ? "" : "s"}.`;
  await prisma.dailyPracticeSession.update({
    where: { id: session.id },
    data: { status: "completed", completedAt: new Date(), summary, items: { updateMany: { where: {}, data: { completed: true } } } },
  });

  const result = await persistEvidenceAndRefreshProfile({
    studentId: student.id,
    evidenceEvents,
    touchedSkills,
    touchedMisconceptions,
    misconceptionUpdates,
    misconceptionCounterEvidence,
  });

  return { ...result, correctCount, totalCount: session.items.length, skillsPractised };
}

export async function generateRecommendationAndReport(studentId: string, touchedMisconceptions = new Set<string>()) {
  await prisma.studentRecommendation.updateMany({ where: { studentId, status: "active" }, data: { status: "superseded", completedAt: new Date() } });
  const likelyMis = await prisma.studentMisconception.findFirst({ where: { studentId, status: { in: ["likely", "active", "suspected"] } }, orderBy: [{ probability: "desc" }], include: { misconception: true } });
  const weakMastery = await prisma.studentMastery.findFirst({ where: { studentId, evidenceCount: { gt: 0 }, masteryLevel: { lt: 3 } }, orderBy: [{ misconceptionRiskScore: "desc" }, { accuracyScore: "asc" }], include: { skill: true } });
  const transferReady = await prisma.studentMastery.findFirst({ where: { studentId, masteryLevel: 3, transferScore: { lt: 60 } }, orderBy: { accuracyScore: "desc" }, include: { skill: true } });
  let action = "New Skill";
  let targetSkillNodeId: string | null = null;
  let targetMisconceptionId: string | null = null;
  let priorityScore = 60;
  let copy = recommendationCopy(action, "the next Year 6 maths skill", null);
  if (likelyMis && (likelyMis.probability >= 60 || (touchedMisconceptions.has(likelyMis.misconceptionId) && likelyMis.probability >= 35))) {
    action = "Misconception Repair";
    targetMisconceptionId = likelyMis.misconceptionId;
    priorityScore = likelyMis.probability + 15;
    copy = recommendationCopy(action, null, { id: likelyMis.misconceptionId, name: likelyMis.misconception.name });
  } else if (weakMastery) {
    action = weakMastery.retentionScore < 60 ? "Review" : "Representation Practice";
    targetSkillNodeId = weakMastery.skillNodeId;
    priorityScore = 78;
    copy = recommendationCopy(action, weakMastery.skill.microSkill, null);
  } else if (transferReady) {
    action = "Transfer Challenge";
    targetSkillNodeId = transferReady.skillNodeId;
    priorityScore = 72;
    copy = recommendationCopy(action, transferReady.skill.microSkill, null);
  }
  const recommendation = await prisma.studentRecommendation.create({ data: { studentId, recommendedAction: action, targetSkillNodeId, targetMisconceptionId, priorityScore, studentFriendlyRationale: copy.student, parentFriendlyRationale: copy.parent, internalRationale: `${copy.internal}${touchedMisconceptions.size ? ` Touched misconceptions: ${[...touchedMisconceptions].join(", ")}.` : ""}`, status: "active" } });
  const retentionSnapshot = await buildRetentionReportSnapshot(studentId);
  const strengths = await prisma.studentMastery.findMany({ where: { studentId, accuracyScore: { gte: 75 } }, include: { skill: true }, take: 4, orderBy: { accuracyScore: "desc" } });
  const focusAreas = await prisma.studentMastery.findMany({ where: { studentId, evidenceCount: { gt: 0 }, masteryLevel: { lt: 3 } }, include: { skill: true }, take: 4, orderBy: { accuracyScore: "asc" } });
  const activeMis = await prisma.studentMisconception.findMany({ where: { studentId, probability: { gte: 35 } }, include: { misconception: true }, orderBy: { probability: "desc" }, take: 3 });
  await prisma.parentReport.create({ data: { studentId, periodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), periodEnd: new Date(), summary: strengths.length ? "Haim is beginning to show clear strengths in parts of Year 6 maths. The next step is to turn correct answers into explainable, transferable, and remembered understanding." : "Haim has completed the first diagnostic, so the platform is building an initial learning profile rather than assigning a grade.", strengths: strengths.map((m) => `${m.skill.microSkill} (${Math.round(m.accuracyScore)}% accuracy evidence)`) as Prisma.InputJsonValue, focusAreas: focusAreas.map((m) => `${m.skill.microSkill}: ${m.whyThisStatus}`) as Prisma.InputJsonValue, retentionStatus: retentionSnapshot as Prisma.InputJsonValue, misconceptionNotes: activeMis.map((m) => `Possible learning focus: ${m.misconception.name}. Probability ${Math.round(m.probability)}%.`) as Prisma.InputJsonValue, recommendedHomeSupport: likelyMis ? copy.parent : retentionSnapshot.suggestedHomeSupport } });
  return recommendation;
}
