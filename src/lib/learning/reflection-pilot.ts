import type { DailyPracticeRecord } from "./practice-progress";

export const REFLECTION_PILOT_ENABLED = true;
export const REFLECTION_PILOT_CONCEPT = "equivalent-fractions" as const;
export const REFLECTION_PILOT_LABEL = "Equivalent fractions";
export const REFLECTION_REVIEW_DELAY_DAYS = 3;

export type ReflectionThinkingChoice =
  | "scaled-both"
  | "same-amount"
  | "simplified-check"
  | "changed-one-part"
  | "compared-digits"
  | "not-sure";

export type ReflectionTransferResult = {
  questionId: string;
  prompt: string;
  answer: string;
  selected: string;
  correct: boolean;
  attempts: number;
  completedWithoutHint: boolean;
  guidedResolution: boolean;
};

export type ReflectionDelayedReview = ReflectionTransferResult & {
  completedAt: string;
};

export type ReflectionMissionRecord = {
  version: 1;
  concept: typeof REFLECTION_PILOT_CONCEPT;
  kind: "repair" | "reason" | "delayed-review";
  missionDate: string;
  startedAt: string;
  completed: boolean;
  completedAt?: string;
  sourceQuestionId?: string;
  sourcePrompt?: string;
  sourceAnswer?: string;
  sourceSelected?: string;
  thinkingChoice?: ReflectionThinkingChoice;
  hintUsed: boolean;
  modelInteractionCompleted: boolean;
  transfer?: ReflectionTransferResult;
  reviewDueDate?: string;
  delayedReview?: ReflectionDelayedReview;
};

export type ReflectionPilotQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  baseNumerator: number;
  baseDenominator: number;
  scale: number;
};

const questions: ReflectionPilotQuestion[] = [
  {
    id: "pilot-equivalent-1-2-x2",
    prompt: "Which fraction is equal to 1/2?",
    choices: ["2/4", "2/3", "1/4", "3/4"],
    answer: "2/4",
    baseNumerator: 1,
    baseDenominator: 2,
    scale: 2,
  },
  {
    id: "pilot-equivalent-2-3-x2",
    prompt: "Which fraction names the same amount as 2/3?",
    choices: ["4/6", "3/5", "4/5", "2/6"],
    answer: "4/6",
    baseNumerator: 2,
    baseDenominator: 3,
    scale: 2,
  },
  {
    id: "pilot-equivalent-3-4-x2",
    prompt: "Split every fourth into 2 equal pieces. What is equal to 3/4?",
    choices: ["6/8", "5/8", "3/8", "6/6"],
    answer: "6/8",
    baseNumerator: 3,
    baseDenominator: 4,
    scale: 2,
  },
  {
    id: "pilot-equivalent-2-5-x3",
    prompt:
      "A banner is 2/5 coloured. Each fifth is split into 3 pieces. What fraction is coloured now?",
    choices: ["6/15", "5/15", "6/8", "2/15"],
    answer: "6/15",
    baseNumerator: 2,
    baseDenominator: 5,
    scale: 3,
  },
  {
    id: "pilot-equivalent-3-5-x3",
    prompt: "Which fraction is 3/5 scaled by 3?",
    choices: ["9/15", "6/15", "9/8", "3/15"],
    answer: "9/15",
    baseNumerator: 3,
    baseDenominator: 5,
    scale: 3,
  },
  {
    id: "pilot-equivalent-4-7-x2",
    prompt: "Which fraction covers the same amount as 4/7?",
    choices: ["8/14", "6/14", "8/9", "4/14"],
    answer: "8/14",
    baseNumerator: 4,
    baseDenominator: 7,
    scale: 2,
  },
];

export function addPracticeDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function questionIndex(questionId: string | undefined) {
  const index = questions.findIndex((question) => question.id === questionId);
  return index < 0 ? 0 : index;
}

export function buildReflectionQuestion(
  seed: number,
  avoidQuestionId?: string,
) {
  const firstIndex = Math.abs(seed) % questions.length;
  const avoidIndex = questionIndex(avoidQuestionId);
  const index =
    questions[firstIndex].id === avoidQuestionId
      ? (avoidIndex + 2) % questions.length
      : firstIndex;
  return questions[index];
}

export function findDueReflectionReview(
  records: DailyPracticeRecord[],
  date: string,
) {
  return records
    .filter((record) => {
      const mission = record.reflectionMission;
      return Boolean(
        mission?.completed &&
          mission.kind !== "delayed-review" &&
          mission.transfer &&
          mission.reviewDueDate &&
          mission.reviewDueDate <= date &&
          !mission.delayedReview,
      );
    })
    .sort((a, b) =>
      (a.reflectionMission?.reviewDueDate ?? "").localeCompare(
        b.reflectionMission?.reviewDueDate ?? "",
      ),
    )[0];
}

export function summarizeReflectionPilot(
  records: DailyPracticeRecord[],
  date: string,
) {
  const startDate = addPracticeDays(date, -13);
  const missions = records
    .map((record) => record.reflectionMission)
    .filter((mission): mission is ReflectionMissionRecord =>
      Boolean(
        mission &&
          mission.missionDate >= startDate &&
          mission.missionDate <= date,
      ),
    );
  const completed = missions.filter((mission) => mission.completed);
  const transferResults = completed
    .filter((mission) => mission.kind === "repair")
    .map((mission) => mission.transfer)
    .filter((result): result is ReflectionTransferResult => Boolean(result));
  const delayedResults = records
    .map((record) => record.reflectionMission?.delayedReview)
    .filter(
      (result): result is ReflectionDelayedReview =>
        Boolean(
          result &&
            result.completedAt.slice(0, 10) >= startDate &&
            result.completedAt.slice(0, 10) <= date,
        ),
    );

  return {
    participated: missions.length,
    completed: completed.length,
    independentTransfers: transferResults.filter(
      (result) => result.correct && result.completedWithoutHint,
    ).length,
    guidedFinishes: transferResults.filter((result) => result.guidedResolution)
      .length,
    delayedChecks: delayedResults.length,
    delayedSuccesses: delayedResults.filter(
      (result) => result.correct && result.completedWithoutHint,
    ).length,
    enoughData: completed.length >= 4 && delayedResults.length >= 1,
  };
}
