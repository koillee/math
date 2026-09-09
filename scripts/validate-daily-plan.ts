import assert from "node:assert/strict";
import { estimateQuestionDifficulty, inferredPracticeLabels, isAnswerCorrect } from "../src/lib/learning/daily-bank";
import { buildDailyPlan, DAILY_PLAN_KEY, practiceDate, resolveDailyPlan, reviewPriorities } from "../src/lib/learning/daily-plan";
import { skillDefinitions, skillIdForLabel, type DailyPracticeRecord, type PracticeItemRecord, type PracticeSkillId } from "../src/lib/learning/practice-progress";

function record(skill: PracticeSkillId, overrides: Partial<PracticeItemRecord> = {}, date = "2026-09-09"): DailyPracticeRecord {
  return {
    id: `${date}-${skill}`, date, completedAt: `${date}T10:00:00Z`,
    topic: skillDefinitions[skill].topic, lessonTitle: "Test lesson", total: 1,
    correct: overrides.correct ? 1 : 0, firstTryCorrect: 0, needsReview: [],
    items: [{ id: "test-item", topic: skillDefinitions[skill].topic, skillId: skill,
      label: skillDefinitions[skill].labels[0], prompt: "Earlier question", answer: "2/4", selected: "1/4", correct: false, attempts: 1, ...overrides }],
  };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

const date = "2026-09-10";
const skills = Object.keys(skillDefinitions) as PracticeSkillId[];
for (const skill of skills) {
  for (const outcome of [{}, { correct: true, attempts: 2 }, { correct: true, feedback: "confusing" as const }, { correct: true, feedback: "guessed" as const }, { correct: true, feedback: "too-hard" as const }]) {
    const history = [record(skill, outcome)];
    const plan = buildDailyPlan(date, history);
    assert.equal(plan.focusSkillId, skill);
    assert.equal(plan.todayTopic, skillDefinitions[skill].topic);
    assert.ok(plan.questions.some((question) => skillIdForLabel(question.label) === skill));
    const labels = inferredPracticeLabels(plan.todayTopic, plan.lesson);
    assert.ok(plan.questions.filter((question) => labels.includes(question.label)).length >= 2, `Lesson alignment: ${skill}`);
  }
}

const weak = [record("equivalent-fractions")];
const recovered = [record("equivalent-fractions", { correct: true }, "2026-09-11"), record("equivalent-fractions", { correct: true }, "2026-09-10"), ...weak];
assert.equal(reviewPriorities(recovered, "2026-09-12").length, 0);
assert.deepEqual(buildDailyPlan(date, []), buildDailyPlan(date, [record("discounts", {}, "2026-09-12")]));

const storage = memoryStorage();
const preview = resolveDailyPlan(date, weak, "preview", 0, storage);
assert.deepEqual(resolveDailyPlan(date, weak, "start", 0, storage), preview);
assert.deepEqual(resolveDailyPlan(date, recovered, "start", 0, storage), preview, "Started questions must not change as results are saved");
const newStorage = memoryStorage();
const before = resolveDailyPlan(date, [], "preview", 0, newStorage);
const after = resolveDailyPlan(date, weak, "preview", 0, newStorage);
assert.notDeepEqual(before, after, "Unstarted preview must update with new evidence");
assert.deepEqual(resolveDailyPlan(date, weak, "start", 0, newStorage), after);
const readOnly = { getItem: storage.getItem, setItem: () => { throw new Error("Full storage"); } };
assert.deepEqual(resolveDailyPlan(date, recovered, "start", 0, readOnly), preview);
storage.setItem(DAILY_PLAN_KEY, "broken JSON");
assert.equal(resolveDailyPlan(date, weak, "start", 0, storage).questions.length, 6);
assert.equal(resolveDailyPlan(date, weak, "start", 0, { getItem: () => { throw new Error("Disabled"); }, setItem: () => { throw new Error("Disabled"); } }).questions.length, 6);

assert.equal(practiceDate(new Date("2026-09-09T15:59:59Z")), "2026-09-09");
assert.equal(practiceDate(new Date("2026-09-09T16:00:00Z")), "2026-09-10");
assert.equal(practiceDate(new Date("2026-12-31T12:00:00Z"), 1), "2027-01-01");

let count = 0;
for (let day = 0; day < 90; day += 1) {
  const dayDate = practiceDate(new Date("2026-09-10T00:00:00Z"), day);
  for (const skill of skills) {
    const plan = buildDailyPlan(dayDate, [record(skill)], day % 3);
    assert.equal(plan.questions.length, 6);
    assert.equal(new Set(plan.questions.map((question) => question.prompt)).size, 6);
    for (const question of plan.questions) {
      assert.notEqual(estimateQuestionDifficulty(question), "Stretch");
      assert.equal(question.choices.filter((choice) => isAnswerCorrect(question, choice)).length, 1);
      count += 1;
    }
  }
}
const initial = buildDailyPlan(date, weak);
const previous: DailyPracticeRecord = {
  ...record("equivalent-fractions"),
  items: initial.questions.map((question) => ({ ...question, skillId: skillIdForLabel(question.label), selected: question.answer, correct: true, attempts: 1 })),
};
const next = buildDailyPlan(date, [previous, ...weak], 1);
assert.ok(next.questions.every((question) => !initial.questions.some((old) => old.prompt === question.prompt)), "Refresh should avoid recently used questions");
console.log(`Daily plan checks passed: ${count} questions, 18 skills, recovery, preview/start equality, frozen sessions, new history, storage failure, date boundaries, and refreshed variety.`);
