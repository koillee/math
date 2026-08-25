import type { MathItem, SkillGraph, StudentRecommendation } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "./seed";

type ItemWithSkill = MathItem & { skill: SkillGraph };

type SelectionCandidate = ItemWithSkill & { priorUseCount: number; targetMatch: boolean };

export type NextBestActionState = {
  studentId: string;
  recommendation: StudentRecommendation | null;
  selectedItem: ItemWithSkill | null;
  priorUseCount: number;
  reason: string;
  fallbackUsed: boolean;
  expectedItemTypes: string[];
  activityType: "next" | "retention";
  requestedItemId?: string;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function representationOptions(value: unknown): string[] {
  return stringArray(value);
}

export function misconceptionIds(value: unknown): string[] {
  return stringArray(value);
}

export function acceptedAnswers(value: unknown): string[] {
  return stringArray(value);
}

function itemTypesForRecommendation(action?: string) {
  switch (action) {
    case "Misconception Repair":
      return ["Misconception Repair"];
    case "Review":
      return ["Review", "Retention"];
    case "Representation Practice":
      return ["Explanation", "Review"];
    case "Transfer Challenge":
      return ["Transfer", "Challenge"];
    case "New Skill":
      return ["Review", "Diagnostic"];
    default:
      return ["Review", "Diagnostic"];
  }
}

function targetMatch(item: ItemWithSkill, recommendation: StudentRecommendation) {
  if (recommendation.targetMisconceptionId && misconceptionIds(item.misconceptionIds).includes(recommendation.targetMisconceptionId)) return true;
  if (recommendation.targetSkillNodeId && item.skillNodeId === recommendation.targetSkillNodeId) return true;
  return false;
}

function reasonForSelection({ recommendation, selectedItem, expectedItemTypes, fallbackUsed, priorUseCount }: { recommendation: StudentRecommendation; selectedItem: ItemWithSkill; expectedItemTypes: string[]; fallbackUsed: boolean; priorUseCount: number }) {
  const target = recommendation.targetMisconceptionId ?? recommendation.targetSkillNodeId;
  const targetCopy = target ? ` It targets ${target}.` : " It uses the current profile-level recommendation.";
  const reuseCopy = priorUseCount ? ` This item has been used ${priorUseCount} time${priorUseCount === 1 ? "" : "s"} before, but it is still the best available match.` : " It has not been used before in this evidence log.";
  if (fallbackUsed) {
    return `The system could not find an exact ${recommendation.recommendedAction} item for the current target, so it chose the closest active ${selectedItem.itemType} item from the ${expectedItemTypes.join("/")} family.${targetCopy}${reuseCopy}`;
  }
  return `The active recommendation is ${recommendation.recommendedAction}, so the system selected a matching ${selectedItem.itemType} item.${targetCopy}${reuseCopy}`;
}

async function requestedRetentionItemState({ studentId, recommendation, requestedItemId }: { studentId: string; recommendation: StudentRecommendation | null; requestedItemId: string }): Promise<NextBestActionState | null> {
  const item = await prisma.mathItem.findFirst({
    where: { itemId: requestedItemId, active: true, subject: "Mathematics", yearGroup: "Year 6", itemType: { in: ["Retention", "Review"] } },
    include: { skill: true },
  });
  if (!item) return null;
  const priorUseCount = await prisma.evidenceEvent.count({ where: { studentId, itemId: item.itemId } });
  return {
    studentId,
    recommendation,
    selectedItem: item,
    priorUseCount,
    reason: `The retention queue selected this ${item.itemType} item because ${item.skill.microSkill} needs a short memory check. It uses an existing active item-bank record, not a lesson or worksheet.${priorUseCount ? ` This item has been used ${priorUseCount} time${priorUseCount === 1 ? "" : "s"} before.` : " It has not been used before in this evidence log."}`,
    fallbackUsed: false,
    expectedItemTypes: ["Retention", "Review"],
    activityType: "retention",
    requestedItemId,
  };
}

export async function getNextBestActionState(options: { requestedItemId?: string } = {}): Promise<NextBestActionState> {
  const student = await ensureSeedData();
  const recommendation = await prisma.studentRecommendation.findFirst({
    where: { studentId: student.id, status: "active" },
    orderBy: { generatedAt: "desc" },
  });

  const requestedItemId = options.requestedItemId?.trim();
  if (requestedItemId) {
    const requested = await requestedRetentionItemState({ studentId: student.id, recommendation, requestedItemId });
    if (requested) return requested;
  }

  if (!recommendation) {
    return {
      studentId: student.id,
      recommendation: null,
      selectedItem: null,
      priorUseCount: 0,
      reason: requestedItemId ? `The requested review item (${requestedItemId}) is not an active Review/Retention item. Run the diagnostic first so MasteryOS can choose a meaningful next activity instead of guessing.` : "Run the diagnostic first so MasteryOS can choose a meaningful next activity instead of guessing.",
      fallbackUsed: Boolean(requestedItemId),
      expectedItemTypes: [],
      activityType: "next",
      requestedItemId,
    };
  }

  const expectedItemTypes = itemTypesForRecommendation(recommendation.recommendedAction);
  const itemPool = await prisma.mathItem.findMany({
    where: { active: true, itemType: { in: expectedItemTypes } },
    include: { skill: true },
    orderBy: [{ sequence: "asc" }, { itemId: "asc" }],
  });

  let candidates = itemPool;
  if (candidates.length === 0) {
    candidates = await prisma.mathItem.findMany({
      where: { active: true },
      include: { skill: true },
      orderBy: [{ sequence: "asc" }, { itemId: "asc" }],
    });
  }

  const withUseCounts: SelectionCandidate[] = await Promise.all(
    candidates.map(async (item) => ({
      ...item,
      targetMatch: targetMatch(item, recommendation),
      priorUseCount: await prisma.evidenceEvent.count({ where: { studentId: student.id, itemId: item.itemId } }),
    }))
  );

  const sorted = withUseCounts.sort((a, b) => Number(b.targetMatch) - Number(a.targetMatch) || a.priorUseCount - b.priorUseCount || a.sequence - b.sequence || a.itemId.localeCompare(b.itemId));
  const selected = sorted[0] ?? null;

  if (!selected) {
    return {
      studentId: student.id,
      recommendation,
      selectedItem: null,
      priorUseCount: 0,
      reason: "No active item-bank item is currently available for this recommendation.",
      fallbackUsed: true,
      expectedItemTypes,
      activityType: "next",
      requestedItemId,
    };
  }

  const fallbackUsed = !selected.targetMatch && Boolean(recommendation.targetSkillNodeId || recommendation.targetMisconceptionId);
  return {
    studentId: student.id,
    recommendation,
    selectedItem: selected,
    priorUseCount: selected.priorUseCount,
    reason: requestedItemId ? `The requested review item (${requestedItemId}) was not available, so MasteryOS fell back to the current recommendation. ${reasonForSelection({ recommendation, selectedItem: selected, expectedItemTypes, fallbackUsed, priorUseCount: selected.priorUseCount })}` : reasonForSelection({ recommendation, selectedItem: selected, expectedItemTypes, fallbackUsed, priorUseCount: selected.priorUseCount }),
    fallbackUsed: fallbackUsed || Boolean(requestedItemId),
    expectedItemTypes,
    activityType: "next",
    requestedItemId,
  };
}

export async function getNextActionSubmissionContext(itemId: string) {
  await ensureSeedData();
  return prisma.mathItem.findUnique({ where: { itemId }, include: { skill: true } });
}
