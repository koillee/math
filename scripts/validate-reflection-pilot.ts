import assert from "node:assert/strict";
import { buildDailyPlan, practiceDate } from "../src/lib/learning/daily-plan";
import type { DailyPracticeRecord } from "../src/lib/learning/practice-progress";
import {
  REFLECTION_PILOT_LABEL,
  addPracticeDays,
  buildReflectionQuestion,
  findDueReflectionReview,
  summarizeReflectionPilot,
} from "../src/lib/learning/reflection-pilot";

function fractionValue(value: string) {
  const [numerator, denominator] = value.split("/").map(Number);
  return numerator / denominator;
}

for (let seed = 0; seed < 120; seed += 1) {
  const question = buildReflectionQuestion(seed);
  assert.equal(question.choices.length, 4);
  assert.equal(new Set(question.choices).size, 4);
  assert.equal(
    question.choices.filter(
      (choice) => fractionValue(choice) === fractionValue(question.answer),
    ).length,
    1,
  );
  const changed = buildReflectionQuestion(seed, question.id);
  assert.notEqual(changed.id, question.id);
}

assert.equal(addPracticeDays("2026-12-31", 3), "2027-01-03");

for (let day = 0; day < 40; day += 1) {
  const date = practiceDate(new Date("2026-09-01T00:00:00Z"), day);
  const plan = buildDailyPlan(date, [], day % 3);
  assert.equal(plan.questions.length, 6);
  assert.equal(
    plan.questions.filter((question) => question.label === REFLECTION_PILOT_LABEL)
      .length,
    1,
  );
  assert.ok(
    plan.questions.filter((question) => question.topic === plan.todayTopic)
      .length >= 3,
  );
}

const baseRecord: DailyPracticeRecord = {
  id: "2026-09-10-fractions-0",
  date: "2026-09-10",
  completedAt: "2026-09-10T10:00:00Z",
  topic: "fractions",
  lessonTitle: "Equivalent fractions",
  total: 1,
  correct: 0,
  firstTryCorrect: 0,
  needsReview: ["fractions"],
  items: [
    {
      id: "source",
      topic: "fractions",
      label: REFLECTION_PILOT_LABEL,
      prompt: "Which fraction equals 1/2?",
      answer: "2/4",
      selected: "2/3",
      correct: false,
      attempts: 2,
    },
  ],
  reflectionMission: {
    version: 1,
    concept: "equivalent-fractions",
    kind: "repair",
    missionDate: "2026-09-10",
    startedAt: "2026-09-10T10:02:00Z",
    completed: true,
    completedAt: "2026-09-10T10:04:00Z",
    hintUsed: true,
    modelInteractionCompleted: true,
    transfer: {
      questionId: "pilot-equivalent-2-3-x2",
      prompt: "Which fraction names the same amount as 2/3?",
      answer: "4/6",
      selected: "4/6",
      correct: true,
      attempts: 1,
      completedWithoutHint: true,
      guidedResolution: false,
    },
    reviewDueDate: "2026-09-13",
  },
};

assert.equal(findDueReflectionReview([baseRecord], "2026-09-12"), undefined);
assert.equal(findDueReflectionReview([baseRecord], "2026-09-13")?.id, baseRecord.id);

const withDelayedReview: DailyPracticeRecord = {
  ...baseRecord,
  reflectionMission: {
    ...baseRecord.reflectionMission!,
    delayedReview: {
      questionId: "pilot-equivalent-3-4-x2",
      prompt: "What is equal to 3/4?",
      answer: "6/8",
      selected: "6/8",
      correct: true,
      attempts: 1,
      completedWithoutHint: true,
      guidedResolution: false,
      completedAt: "2026-09-13T10:00:00Z",
    },
  },
};
assert.equal(findDueReflectionReview([withDelayedReview], "2026-09-13"), undefined);

const summary = summarizeReflectionPilot([withDelayedReview], "2026-09-13");
assert.equal(summary.participated, 1);
assert.equal(summary.completed, 1);
assert.equal(summary.independentTransfers, 1);
assert.equal(summary.delayedChecks, 1);
assert.equal(summary.delayedSuccesses, 1);
assert.equal(summary.enoughData, false);

console.log(
  "Reflection pilot checks passed: daily inclusion, bounded retries data, transfer variety, three-day scheduling, and cautious summary.",
);
