import {
  buildDailySetFromSeed,
  estimateQuestionDifficulty,
  inferredPracticeLabels,
  isAnswerCorrect,
} from "../src/app/daily-practice/DailyPractice";
import {
  buildPrompt,
  makeOptions,
  validatePrompt,
} from "../src/app/gugudan/GugudanPractice";

const modes = ["focus", "mixed", "reverse", "hard"] as const;
const dailyPrompts = new Set<string>();
let dailyPromptCount = 0;
const minimumDailyVarietyRatio = 0.78;

for (let seed = 20260901; seed < 20261401; seed += 1) {
  const dailySet = buildDailySetFromSeed(seed);
  if (dailySet.questions.length !== 6) {
    throw new Error(`Seed ${seed} created ${dailySet.questions.length} questions`);
  }
  const sessionPrompts = new Set(dailySet.questions.map((question) => question.prompt));
  if (sessionPrompts.size !== dailySet.questions.length) {
    throw new Error(`Seed ${seed} repeated a prompt inside one session`);
  }
  const topicAlignedQuestions = dailySet.questions.filter(
    (question) => question.topic === dailySet.todayTopic,
  );
  if (topicAlignedQuestions.length < 3) {
    throw new Error(
      `Seed ${seed} only created ${topicAlignedQuestions.length} questions for ${dailySet.todayTopic}`,
    );
  }
  const lessonLabels = new Set(
    inferredPracticeLabels(dailySet.todayTopic, dailySet.lesson),
  );
  const lessonAlignedQuestions = dailySet.questions.filter((question) =>
    lessonLabels.has(question.label),
  );
  if (lessonAlignedQuestions.length < 2) {
    throw new Error(
      `Seed ${seed} only created ${lessonAlignedQuestions.length} questions for lesson "${dailySet.lesson.title}"`,
    );
  }
  for (const question of dailySet.questions) {
    const difficulty = estimateQuestionDifficulty(question);
    if (difficulty === "Stretch") {
      throw new Error(
        `${question.id} is too difficult for daily practice: ${question.prompt}`,
      );
    }
    if (question.choices.length !== 4) {
      throw new Error(
        `${question.id} has ${question.choices.length} choices instead of 4`,
      );
    }
    if (new Set(question.choices).size !== question.choices.length) {
      throw new Error(`${question.id} has duplicate choices`);
    }
    const correctChoices = question.choices.filter((choice) =>
      isAnswerCorrect(question, choice),
    );
    if (
      correctChoices.length !== 1 ||
      correctChoices[0] !== question.answer
    ) {
      throw new Error(
        `${question.id} has ambiguous or missing answer. Correct choices: ${correctChoices.join(", ")}`,
      );
    }
  }
  for (const question of dailySet.questions) {
    dailyPrompts.add(question.prompt);
    dailyPromptCount += 1;
  }
}

if (dailyPrompts.size / dailyPromptCount < minimumDailyVarietyRatio) {
  throw new Error(
    `Daily bank variety is too low: ${dailyPrompts.size}/${dailyPromptCount} unique prompts`,
  );
}

for (const mode of modes) {
  for (const focus of [2, 3, 4, 5, 6, 7, 8, 9]) {
    let previousAnswer: number | null = null;
    for (let step = 0; step < 120; step += 1) {
      const prompt = validatePrompt(
        buildPrompt(mode, focus, {}, step, previousAnswer),
      );
      const choices = makeOptions(prompt.answer, prompt.a, prompt.b);
      if (mode !== "reverse" && previousAnswer === prompt.answer) {
        throw new Error(`${prompt.id} repeats answer ${prompt.answer}`);
      }
      previousAnswer = prompt.answer;
      if (choices.length !== 4) {
        throw new Error(`${prompt.id} has ${choices.length} choices`);
      }
      if (!choices.includes(prompt.answer)) {
        throw new Error(`${prompt.id} is missing the correct answer`);
      }
      if (new Set(choices).size !== choices.length) {
        throw new Error(`${prompt.id} has duplicate choices`);
      }
    }
  }
}

console.log("Practice quality checks passed.");
