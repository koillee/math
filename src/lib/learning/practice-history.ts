import {
  type DailyPracticeRecord,
  type PracticeFeedback,
  type PracticeItemRecord,
  type PracticeSkillId,
  type PracticeTopic,
  skillDefinitions,
} from "./practice-progress";
import type {
  ReflectionDelayedReview,
  ReflectionMissionRecord,
  ReflectionThinkingChoice,
  ReflectionTransferResult,
} from "./reflection-pilot";

const topics: PracticeTopic[] = [
  "multiplication",
  "fractions",
  "decimals",
  "percentages",
];
const feedbackValues: PracticeFeedback[] = [
  "understand",
  "guessed",
  "confusing",
  "too-hard",
];
const difficultyValues = ["Warm-up", "Core", "Stretch"] as const;
const skillIds = new Set(Object.keys(skillDefinitions));
const reflectionKinds = new Set(["repair", "reason", "delayed-review"]);
const thinkingChoices = new Set<ReflectionThinkingChoice>([
  "scaled-both",
  "same-amount",
  "simplified-check",
  "changed-one-part",
  "compared-digits",
  "not-sure",
]);

function boundedString(value: unknown, maximum: number) {
  return typeof value === "string" ? value.slice(0, maximum) : "";
}

function isTopic(value: unknown): value is PracticeTopic {
  return typeof value === "string" && topics.includes(value as PracticeTopic);
}

function isPracticeDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function normalizeDateTime(value: unknown) {
  const text = boundedString(value, 40);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeTransfer(
  value: unknown,
): ReflectionTransferResult | undefined {
  if (!value || typeof value !== "object") return undefined;
  const transfer = value as Record<string, unknown>;
  const questionId = boundedString(transfer.questionId, 180);
  const prompt = boundedString(transfer.prompt, 1_000);
  const answer = boundedString(transfer.answer, 300);
  if (!questionId || !prompt || !answer) return undefined;

  return {
    questionId,
    prompt,
    answer,
    selected: boundedString(transfer.selected, 300),
    correct: transfer.correct === true,
    attempts: Math.max(0, Math.min(2, Number(transfer.attempts) || 0)),
    completedWithoutHint: transfer.completedWithoutHint === true,
    guidedResolution: transfer.guidedResolution === true,
  };
}

function normalizeDelayedReview(
  value: unknown,
): ReflectionDelayedReview | undefined {
  const transfer = normalizeTransfer(value);
  if (!transfer || !value || typeof value !== "object") return undefined;
  const completedAt = normalizeDateTime(
    (value as Record<string, unknown>).completedAt,
  );
  return completedAt ? { ...transfer, completedAt } : undefined;
}

export function normalizeReflectionMission(
  value: unknown,
): ReflectionMissionRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const mission = value as Record<string, unknown>;
  const missionDate = boundedString(mission.missionDate, 10);
  const startedAt = normalizeDateTime(mission.startedAt);
  const completedAt = normalizeDateTime(mission.completedAt);
  const reviewDueDate = boundedString(mission.reviewDueDate, 10);
  const kind = boundedString(mission.kind, 30);
  if (
    mission.version !== 1 ||
    mission.concept !== "equivalent-fractions" ||
    !reflectionKinds.has(kind) ||
    !isPracticeDate(missionDate) ||
    !startedAt ||
    typeof mission.completed !== "boolean" ||
    typeof mission.hintUsed !== "boolean" ||
    typeof mission.modelInteractionCompleted !== "boolean" ||
    (mission.completed && !completedAt) ||
    (reviewDueDate && !isPracticeDate(reviewDueDate))
  ) {
    return undefined;
  }

  const thinkingChoice = thinkingChoices.has(
    mission.thinkingChoice as ReflectionThinkingChoice,
  )
    ? (mission.thinkingChoice as ReflectionThinkingChoice)
    : undefined;

  return {
    version: 1,
    concept: "equivalent-fractions",
    kind: kind as ReflectionMissionRecord["kind"],
    missionDate,
    startedAt,
    completed: mission.completed,
    completedAt,
    sourceQuestionId: boundedString(mission.sourceQuestionId, 180) || undefined,
    sourcePrompt: boundedString(mission.sourcePrompt, 1_000) || undefined,
    sourceAnswer: boundedString(mission.sourceAnswer, 300) || undefined,
    sourceSelected: boundedString(mission.sourceSelected, 300) || undefined,
    thinkingChoice,
    hintUsed: mission.hintUsed,
    modelInteractionCompleted: mission.modelInteractionCompleted,
    transfer: normalizeTransfer(mission.transfer),
    reviewDueDate: reviewDueDate || undefined,
    delayedReview: normalizeDelayedReview(mission.delayedReview),
  };
}

function reflectionRank(mission: ReflectionMissionRecord | undefined) {
  if (!mission) return 0;
  if (mission.delayedReview) return 3;
  if (mission.completed) return 2;
  return 1;
}

function reflectionTimestamp(mission: ReflectionMissionRecord) {
  return (
    mission.delayedReview?.completedAt ??
    mission.completedAt ??
    mission.startedAt
  );
}

export function selectMoreCompleteReflection(first: unknown, second: unknown) {
  const left = normalizeReflectionMission(first);
  const right = normalizeReflectionMission(second);
  if (!left) return right;
  if (!right) return left;
  const rankDifference = reflectionRank(right) - reflectionRank(left);
  if (rankDifference !== 0) return rankDifference > 0 ? right : left;
  return reflectionTimestamp(right) >= reflectionTimestamp(left) ? right : left;
}

function normalizeItem(
  value: unknown,
  fallbackTopic: PracticeTopic,
  position: number,
): PracticeItemRecord | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const label = boundedString(item.label, 120);
  const prompt = boundedString(item.prompt, 1_000);
  const answer = boundedString(item.answer, 300);
  if (!label || !prompt || !answer) return null;

  const skillId = skillIds.has(String(item.skillId))
    ? (item.skillId as PracticeSkillId)
    : undefined;
  const feedback = feedbackValues.includes(item.feedback as PracticeFeedback)
    ? (item.feedback as PracticeFeedback)
    : undefined;
  const difficulty = difficultyValues.includes(
    item.difficulty as (typeof difficultyValues)[number],
  )
    ? (item.difficulty as PracticeItemRecord["difficulty"])
    : undefined;

  return {
    id: boundedString(item.id, 180) || `question-${position + 1}`,
    topic: isTopic(item.topic) ? item.topic : fallbackTopic,
    skillId,
    skillName: boundedString(item.skillName, 160) || undefined,
    label,
    prompt,
    answer,
    selected: boundedString(item.selected, 300),
    firstWrongAnswer: boundedString(item.firstWrongAnswer, 300) || undefined,
    hintUsed: typeof item.hintUsed === "boolean" ? item.hintUsed : undefined,
    correct: item.correct === true,
    attempts: Math.max(0, Math.min(20, Math.floor(Number(item.attempts) || 0))),
    difficulty,
    feedback,
  };
}

export function normalizePracticeRecord(
  value: unknown,
): DailyPracticeRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!isTopic(record.topic)) return null;

  const id = boundedString(record.id, 220);
  const date = boundedString(record.date, 10);
  const completedAtText = boundedString(record.completedAt, 40);
  const completedAt = new Date(completedAtText);
  if (!id || !isPracticeDate(date) || Number.isNaN(completedAt.getTime())) {
    return null;
  }

  const rawItems = Array.isArray(record.items) ? record.items.slice(0, 20) : [];
  const items = rawItems
    .map((item, position) =>
      normalizeItem(item, record.topic as PracticeTopic, position),
    )
    .filter((item): item is PracticeItemRecord => item !== null);
  if (!items.length) return null;

  const correct = items.filter((item) => item.correct).length;
  const firstTryCorrect = items.filter(
    (item) => item.correct && item.attempts === 1,
  ).length;
  const needsReview = Array.from(
    new Set(
      items
        .filter(
          (item) =>
            !item.correct ||
            item.attempts > 1 ||
            item.feedback === "guessed" ||
            item.feedback === "confusing" ||
            item.feedback === "too-hard",
        )
        .map((item) => item.topic),
    ),
  );

  return {
    id,
    date,
    completedAt: completedAt.toISOString(),
    topic: record.topic,
    lessonTitle:
      boundedString(record.lessonTitle, 240) || "Daily maths practice",
    total: items.length,
    correct,
    firstTryCorrect,
    needsReview,
    items,
    reflectionMission: normalizeReflectionMission(record.reflectionMission),
  };
}

export function normalizePracticeRecords(
  value: unknown,
  maximum = 200,
): DailyPracticeRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maximum)
    .map(normalizePracticeRecord)
    .filter((record): record is DailyPracticeRecord => record !== null);
}

export function mergePracticeHistories(
  localRecords: DailyPracticeRecord[],
  databaseRecords: DailyPracticeRecord[],
  maximum = 200,
) {
  const recordsById = new Map<string, DailyPracticeRecord>();
  for (const record of [...localRecords, ...databaseRecords]) {
    const normalized = normalizePracticeRecord(record);
    if (!normalized) continue;
    const existing = recordsById.get(normalized.id);
    if (!existing) {
      recordsById.set(normalized.id, normalized);
      continue;
    }
    const newerCore =
      normalized.completedAt >= existing.completedAt ? normalized : existing;
    recordsById.set(normalized.id, {
      ...newerCore,
      reflectionMission: selectMoreCompleteReflection(
        existing.reflectionMission,
        normalized.reflectionMission,
      ),
    });
  }
  return Array.from(recordsById.values())
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, maximum);
}

export function practiceRecordsNeedingUpload(
  localRecords: DailyPracticeRecord[],
  databaseRecords: DailyPracticeRecord[],
  maximum = 50,
) {
  const databaseById = new Map(
    normalizePracticeRecords(databaseRecords).map((record) => [
      record.id,
      record,
    ]),
  );
  return normalizePracticeRecords(localRecords)
    .filter((localRecord) => {
      const databaseRecord = databaseById.get(localRecord.id);
      if (!databaseRecord) return true;
      const mergedRecord = mergePracticeHistories(
        [localRecord],
        [databaseRecord],
        1,
      )[0];
      return JSON.stringify(mergedRecord) !== JSON.stringify(databaseRecord);
    })
    .slice(0, maximum);
}
