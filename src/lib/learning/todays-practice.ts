import type { DailyPracticeItem, DailyPracticeSession, MathItem, SkillGraph } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getNextBestActionState } from "./next-best-action";
import { getRetentionQueueStateForStudent } from "./retention-queue";
import { ensureSeedData } from "./seed";

export const DAILY_PRACTICE_SIZE = 5;

type ItemWithSkill = MathItem & { skill: SkillGraph };
type PracticeItemWithItem = DailyPracticeItem & { item: ItemWithSkill };
type PracticeSessionWithItems = DailyPracticeSession & { items: PracticeItemWithItem[] };

type Candidate = {
  item: ItemWithSkill;
  sourceType: string;
  reasonChosen: string;
};

export type TodaysPracticeState = {
  studentId: string;
  practiceDate: string;
  session: PracticeSessionWithItems;
  items: PracticeItemWithItem[];
  statusLabel: "Not started" | "Completed today";
  isCompleted: boolean;
  completedEvidence: {
    correctCount: number;
    totalCount: number;
    skillsPractised: string[];
    learnedToday: string[];
  } | null;
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dailyPracticeAttemptId(session: Pick<DailyPracticeSession, "id" | "practiceDate">) {
  return `daily-practice-${session.practiceDate}-${session.id}`;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function todayRepresentationOptions(value: unknown): string[] {
  return stringArray(value);
}

export function todayMisconceptionIds(value: unknown): string[] {
  return stringArray(value);
}

function itemTypeRank(type: string) {
  const ranks: Record<string, number> = {
    Retention: 1,
    Review: 2,
    "Misconception Repair": 3,
    Explanation: 4,
    Transfer: 5,
    Challenge: 6,
    Diagnostic: 7,
  };
  return ranks[type] ?? 99;
}

async function loadSession(sessionId: string): Promise<PracticeSessionWithItems | null> {
  return prisma.dailyPracticeSession.findUnique({
    where: { id: sessionId },
    include: { items: { include: { item: { include: { skill: true } } }, orderBy: { position: "asc" } } },
  });
}

async function loadTodaysSession(studentId: string, practiceDate: string): Promise<PracticeSessionWithItems | null> {
  return prisma.dailyPracticeSession.findUnique({
    where: { studentId_practiceDate: { studentId, practiceDate } },
    include: { items: { include: { item: { include: { skill: true } } }, orderBy: { position: "asc" } } },
  });
}

async function allActiveItems() {
  return prisma.mathItem.findMany({
    where: { active: true, subject: "Mathematics", yearGroup: "Year 6" },
    include: { skill: true },
    orderBy: [{ sequence: "asc" }, { itemId: "asc" }],
  });
}

function pushCandidate(candidates: Candidate[], usedItemIds: Set<string>, usedSkillIds: Set<string>, candidate: Candidate | null, allowDuplicateSkill = false) {
  if (!candidate) return;
  if (usedItemIds.has(candidate.item.itemId)) return;
  if (!allowDuplicateSkill && usedSkillIds.has(candidate.item.skillNodeId)) return;
  candidates.push(candidate);
  usedItemIds.add(candidate.item.itemId);
  usedSkillIds.add(candidate.item.skillNodeId);
}

function findItem(items: ItemWithSkill[], predicate: (item: ItemWithSkill) => boolean) {
  return [...items].filter(predicate).sort((a, b) => itemTypeRank(a.itemType) - itemTypeRank(b.itemType) || a.sequence - b.sequence || a.itemId.localeCompare(b.itemId))[0] ?? null;
}

async function generatePracticeItems(studentId: string): Promise<Candidate[]> {
  const [nextState, retentionState, activeItems, misconceptions, mastery] = await Promise.all([
    getNextBestActionState(),
    getRetentionQueueStateForStudent(studentId),
    allActiveItems(),
    prisma.studentMisconception.findMany({ where: { studentId, probability: { gte: 35 } }, orderBy: { probability: "desc" } }),
    prisma.studentMastery.findMany({ where: { studentId }, include: { skill: true }, orderBy: [{ masteryLevel: "asc" }, { accuracyScore: "asc" }] }),
  ]);

  const candidates: Candidate[] = [];
  const usedItemIds = new Set<string>();
  const usedSkillIds = new Set<string>();

  if (nextState.selectedItem) {
    pushCandidate(candidates, usedItemIds, usedSkillIds, {
      item: nextState.selectedItem,
      sourceType: "Current Recommendation",
      reasonChosen: "This matches the current recommendation, so it is the first thing to practise today.",
    });
  }

  for (const entry of [...retentionState.sections["Due now"], ...retentionState.sections["Due soon"]]) {
    if (candidates.filter((candidate) => candidate.sourceType === "Retention Queue").length >= 2) break;
    if (!entry.selectedItem) continue;
    pushCandidate(candidates, usedItemIds, usedSkillIds, {
      item: entry.selectedItem,
      sourceType: "Retention Queue",
      reasonChosen: `This skill is in the retention queue: ${entry.reason}`,
    });
  }

  const topMisconception = misconceptions[0];
  if (topMisconception) {
    const repairItem = findItem(activeItems, (item) => item.itemType === "Misconception Repair" && todayMisconceptionIds(item.misconceptionIds).includes(topMisconception.misconceptionId));
    pushCandidate(candidates, usedItemIds, usedSkillIds, repairItem ? {
      item: repairItem,
      sourceType: "Misconception Repair",
      reasonChosen: "This checks a pattern the app is monitoring, using one short repair item.",
    } : null);
  }

  const transferReady = mastery.find((m) => m.evidenceCount > 0 && m.masteryLevel >= 3 && m.transferScore < 70);
  if (transferReady) {
    const transferItem = findItem(activeItems, (item) => item.skillNodeId === transferReady.skillNodeId && ["Transfer", "Challenge"].includes(item.itemType));
    pushCandidate(candidates, usedItemIds, usedSkillIds, transferItem ? {
      item: transferItem,
      sourceType: "Transfer",
      reasonChosen: "This checks whether a stronger skill can be used in a slightly new situation.",
    } : null);
  }

  for (const m of mastery.filter((entry) => entry.evidenceCount > 0)) {
    if (candidates.length >= DAILY_PRACTICE_SIZE) break;
    const reviewItem = findItem(activeItems, (item) => item.skillNodeId === m.skillNodeId && ["Retention", "Review", "Explanation"].includes(item.itemType));
    pushCandidate(candidates, usedItemIds, usedSkillIds, reviewItem ? {
      item: reviewItem,
      sourceType: "Review",
      reasonChosen: "This gives one more short check for a skill already in Haim’s learning profile.",
    } : null);
  }

  for (const item of activeItems.sort((a, b) => itemTypeRank(a.itemType) - itemTypeRank(b.itemType) || a.sequence - b.sequence || a.itemId.localeCompare(b.itemId))) {
    if (candidates.length >= DAILY_PRACTICE_SIZE) break;
    pushCandidate(candidates, usedItemIds, usedSkillIds, {
      item,
      sourceType: "Fallback",
      reasonChosen: "This fills today’s set with an active Year 6 maths item because there were not enough exact matches.",
    });
  }

  for (const item of activeItems.sort((a, b) => itemTypeRank(a.itemType) - itemTypeRank(b.itemType) || a.sequence - b.sequence || a.itemId.localeCompare(b.itemId))) {
    if (candidates.length >= DAILY_PRACTICE_SIZE) break;
    pushCandidate(candidates, usedItemIds, usedSkillIds, {
      item,
      sourceType: "Fallback",
      reasonChosen: "This fills today’s set with an active Year 6 maths item because there were not enough unique-skill matches.",
    }, true);
  }

  return candidates.slice(0, DAILY_PRACTICE_SIZE);
}

async function createTodaysSession(studentId: string, practiceDate: string) {
  const candidates = await generatePracticeItems(studentId);
  const session = await prisma.dailyPracticeSession.create({
    data: {
      studentId,
      practiceDate,
      status: "not_started",
      items: {
        create: candidates.map((candidate, index) => ({
          itemId: candidate.item.itemId,
          position: index + 1,
          sourceType: candidate.sourceType,
          reasonChosen: candidate.reasonChosen,
        })),
      },
    },
  });
  return loadSession(session.id);
}

async function completedEvidenceForSession(session: PracticeSessionWithItems) {
  if (session.status !== "completed") return null;
  const events = await prisma.evidenceEvent.findMany({
    where: { assessmentAttemptId: dailyPracticeAttemptId(session), eventType: "Daily Practice" },
    include: { skill: true },
    orderBy: { createdAt: "asc" },
  });
  const correctCount = events.filter((event) => event.correctness === 100).length;
  const skillsPractised = [...new Set(events.map((event) => event.skill.microSkill))];
  const lowerScoring = events.filter((event) => event.correctness < 100 || event.explanationScore < 65).slice(0, 2);
  return {
    correctCount,
    totalCount: events.length || session.items.length,
    skillsPractised,
    learnedToday: lowerScoring.length
      ? lowerScoring.map((event) => `${event.skill.microSkill} may need another short review.`)
      : ["Haim added useful practice evidence today.", "Correct answers still need future review before permanent mastery is claimed."],
  };
}

export async function getTodaysPracticeState(date = new Date()): Promise<TodaysPracticeState> {
  const student = await ensureSeedData();
  const practiceDate = todayKey(date);
  let session = await loadTodaysSession(student.id, practiceDate);
  if (!session) {
    try {
      session = await createTodaysSession(student.id, practiceDate);
    } catch (error) {
      session = await loadTodaysSession(student.id, practiceDate);
      if (!session) throw error;
    }
  }
  if (!session) throw new Error("Today's practice session could not be loaded.");
  const completedEvidence = await completedEvidenceForSession(session);
  const isCompleted = session.status === "completed";
  return {
    studentId: student.id,
    practiceDate,
    session,
    items: session.items,
    statusLabel: isCompleted ? "Completed today" : "Not started",
    isCompleted,
    completedEvidence,
  };
}

export async function getLatestDailyPracticeSummary(studentId?: string) {
  const student = studentId ? null : await ensureSeedData();
  const targetStudentId = studentId ?? student?.id;
  if (!targetStudentId) return null;
  return prisma.dailyPracticeSession.findFirst({
    where: { studentId: targetStudentId, status: "completed" },
    include: { items: { include: { item: { include: { skill: true } } }, orderBy: { position: "asc" } } },
    orderBy: [{ completedAt: "desc" }, { generatedAt: "desc" }],
  });
}
