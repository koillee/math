import {
  buildDailySetFromSeed,
  isAnswerCorrect,
} from "../src/app/daily-practice/DailyPractice";
import {
  buildPrompt,
  makeOptions,
  validatePrompt,
} from "../src/app/gugudan/GugudanPractice";

const modes = ["focus", "mixed", "reverse", "hard"] as const;

for (let seed = 20260901; seed < 20261050; seed += 1) {
  const dailySet = buildDailySetFromSeed(seed);
  for (const question of dailySet.questions) {
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
}

for (const mode of modes) {
  for (const focus of [2, 3, 4, 5, 6, 7, 8, 9]) {
    for (let step = 0; step < 120; step += 1) {
      const prompt = validatePrompt(buildPrompt(mode, focus, {}, step));
      const choices = makeOptions(prompt.answer, prompt.a, prompt.b);
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
