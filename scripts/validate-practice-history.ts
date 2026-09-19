import assert from "node:assert/strict";
import {
  mergePracticeHistories,
  normalizePracticeRecord,
  normalizePracticeRecords,
  practiceRecordsNeedingUpload,
} from "../src/lib/learning/practice-history";

const sample = {
  id: "2026-09-14-fractions-0",
  date: "2026-09-14",
  completedAt: "2026-09-14T08:30:00.000Z",
  topic: "fractions",
  lessonTitle: "Equivalent fractions keep the same value",
  total: 99,
  correct: 99,
  firstTryCorrect: 99,
  needsReview: [],
  items: [
    {
      id: "fraction-1",
      topic: "fractions",
      skillId: "equivalent-fractions",
      skillName: "Equivalent fractions",
      label: "Equivalent fractions",
      prompt: "Which fraction is equivalent to 1/2?",
      answer: "2/4",
      selected: "2/4",
      correct: true,
      attempts: 1,
      difficulty: "Core",
      feedback: "understand",
    },
    {
      id: "fraction-2",
      topic: "fractions",
      skillId: "fraction-of-amount",
      label: "Fraction of an amount",
      prompt: "What is 3/4 of 20?",
      answer: "15",
      selected: "10",
      firstWrongAnswer: "5",
      hintUsed: true,
      correct: false,
      attempts: 2,
      difficulty: "Core",
      feedback: "confusing",
    },
  ],
  reflectionMission: {
    version: 1,
    concept: "equivalent-fractions",
    kind: "repair",
    missionDate: "2026-09-14",
    startedAt: "2026-09-14T08:31:00.000Z",
    completed: true,
    completedAt: "2026-09-14T08:34:00.000Z",
    hintUsed: true,
    modelInteractionCompleted: true,
    thinkingChoice: "changed-one-part",
    transfer: {
      questionId: "pilot-equivalent-1-2-x2",
      prompt: "Which fraction is equal to 1/2?",
      answer: "2/4",
      selected: "2/4",
      correct: true,
      attempts: 1,
      completedWithoutHint: true,
      guidedResolution: false,
    },
    reviewDueDate: "2026-09-17",
  },
};

const normalized = normalizePracticeRecord(sample);
assert.ok(normalized);
assert.equal(normalized.total, 2);
assert.equal(normalized.correct, 1);
assert.equal(normalized.firstTryCorrect, 1);
assert.equal(normalized.items[1].firstWrongAnswer, "5");
assert.equal(normalized.items[1].hintUsed, true);
assert.equal(normalized.items[0].hintUsed, undefined);
assert.deepEqual(normalized.needsReview, ["fractions"]);
assert.equal(normalized.reflectionMission?.completed, true);
assert.equal(normalized.reflectionMission?.transfer?.correct, true);

assert.equal(normalizePracticeRecord({ ...sample, date: "14/09/2026" }), null);
assert.equal(normalizePracticeRecord({ ...sample, date: "2026-02-30" }), null);
assert.equal(normalizePracticeRecord({ ...sample, topic: "algebra" }), null);
assert.deepEqual(normalizePracticeRecords({ records: [sample] }), []);

const newerDatabaseRecord = {
  ...normalized,
  lessonTitle: "Database copy",
  completedAt: "2026-09-14T09:00:00.000Z",
};
const merged = mergePracticeHistories([normalized], [newerDatabaseRecord]);
assert.equal(merged.length, 1);
assert.equal(merged[0].lessonTitle, "Database copy");
assert.equal(merged[0].completedAt, "2026-09-14T09:00:00.000Z");
assert.equal(merged[0].reflectionMission?.completed, true);
assert.equal(practiceRecordsNeedingUpload([normalized], [normalized]).length, 0);

const newerWithoutReflection = {
  ...normalized,
  reflectionMission: undefined,
  lessonTitle: "Newer core fields",
  completedAt: "2026-09-14T10:00:00.000Z",
};
const preserved = mergePracticeHistories([normalized], [newerWithoutReflection]);
assert.equal(preserved[0].lessonTitle, "Newer core fields");
assert.equal(preserved[0].reflectionMission?.thinkingChoice, "changed-one-part");
assert.equal(
  practiceRecordsNeedingUpload([normalized], [newerWithoutReflection]).length,
  1,
);

const withDelayedReview = {
  ...normalized,
  reflectionMission: {
    ...normalized.reflectionMission!,
    delayedReview: {
      ...normalized.reflectionMission!.transfer!,
      questionId: "pilot-equivalent-3-4-x2",
      completedAt: "2026-09-17T08:30:00.000Z",
    },
  },
};
const delayedPreserved = mergePracticeHistories(
  [withDelayedReview],
  [newerWithoutReflection],
);
assert.equal(
  delayedPreserved[0].reflectionMission?.delayedReview?.questionId,
  "pilot-equivalent-3-4-x2",
);
assert.equal(
  practiceRecordsNeedingUpload([normalized], [withDelayedReview]).length,
  0,
);

const invalidReflection = normalizePracticeRecord({
  ...sample,
  reflectionMission: { ...sample.reflectionMission, missionDate: "bad-date" },
});
assert.ok(invalidReflection);
assert.equal(invalidReflection.reflectionMission, undefined);

console.log("Daily practice history validation and merge checks passed.");
