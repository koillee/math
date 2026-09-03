import { answerMatches, gradeItemBankItem } from "../src/lib/learning/engine";
import { itemBankSeeds, type MathItemSeed } from "../src/lib/learning/item-bank";

type ValidationCase = {
  itemId: string;
  answer: string;
  expectedCorrect: boolean;
  label: string;
};

const failures: string[] = [];

function gradeCorrect(item: MathItemSeed, answer: string) {
  return gradeItemBankItem(item, answer, "because I checked the place value and units carefully", 3, "mental strategy").correctness === 100;
}

function itemById(itemId: string) {
  const item = itemBankSeeds.find((candidate) => candidate.itemId === itemId);
  if (!item) throw new Error(`Missing validation item: ${itemId}`);
  return item;
}

function assertCase(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function isPlainInteger(value: string) {
  return /^\d+$/.test(value.trim());
}

function validateAcceptedAnswers() {
  for (const item of itemBankSeeds) {
    assertCase(item.acceptedAnswers.length > 0, `${item.itemId} has no accepted answers`);
    for (const acceptedAnswer of item.acceptedAnswers) {
      assertCase(gradeCorrect(item, acceptedAnswer), `${item.itemId} should accept configured answer "${acceptedAnswer}"`);
    }
  }
}

function validateCommonWrongAnswers() {
  for (const item of itemBankSeeds) {
    for (const wrongAnswer of item.commonWrongAnswers) {
      assertCase(!gradeCorrect(item, wrongAnswer.answer), `${item.itemId} should reject common wrong answer "${wrongAnswer.answer}"`);
    }
  }
}

function validateIntegerNearMisses() {
  for (const item of itemBankSeeds) {
    for (const acceptedAnswer of item.acceptedAnswers) {
      if (!isPlainInteger(acceptedAnswer)) continue;
      const appendedZero = `${acceptedAnswer}0`;
      const leadingDigit = `1${acceptedAnswer}`;
      assertCase(!gradeCorrect(item, appendedZero), `${item.itemId} should reject substring near-miss "${appendedZero}" for accepted "${acceptedAnswer}"`);
      assertCase(!gradeCorrect(item, leadingDigit), `${item.itemId} should reject substring near-miss "${leadingDigit}" for accepted "${acceptedAnswer}"`);
    }
  }
}

function validateRegressionCases() {
  const cases: ValidationCase[] = [
    { itemId: "ret-dec-004-a", answer: "36", expectedCorrect: true, label: "reported decimal ×1000 correct answer" },
    { itemId: "ret-dec-004-a", answer: "36.0", expectedCorrect: true, label: "reported decimal ×1000 equivalent formatting" },
    { itemId: "ret-dec-004-a", answer: "0.036 × 1000 = 36", expectedCorrect: true, label: "reported decimal ×1000 with working" },
    { itemId: "ret-dec-004-a", answer: "360", expectedCorrect: false, label: "reported decimal ×1000 wrong near miss" },
    { itemId: "ret-dec-004-a", answer: "3.6", expectedCorrect: false, label: "reported decimal ×1000 one-place answer" },
    { itemId: "ret-dec-004-a", answer: "0.36", expectedCorrect: false, label: "reported decimal ×1000 under-scaled answer" },
    { itemId: "ret-dec-004-a", answer: "136", expectedCorrect: false, label: "reported decimal ×1000 embedded correct digits" },
    { itemId: "rev-fdp-005-a", answer: "36", expectedCorrect: true, label: "75 percent of 48 correct answer" },
    { itemId: "rev-fdp-005-a", answer: "360", expectedCorrect: false, label: "75 percent of 48 substring near miss" },
    { itemId: "q10", answer: "340", expectedCorrect: true, label: "diagnostic decimal scaling correct answer" },
    { itemId: "q10", answer: "3400", expectedCorrect: false, label: "diagnostic decimal scaling appended zero" },
    { itemId: "q7", answer: "$5", expectedCorrect: true, label: "diagnostic currency accepted" },
    { itemId: "q7", answer: "50", expectedCorrect: false, label: "diagnostic currency substring near miss" },
    { itemId: "q6", answer: "B", expectedCorrect: true, label: "single-letter class answer" },
    { itemId: "q6", answer: "because", expectedCorrect: false, label: "single-letter answer must not match inside a word" },
    { itemId: "ret-fdp-001-a", answer: "20%", expectedCorrect: true, label: "percent symbol accepted" },
    { itemId: "ret-fdp-001-a", answer: "20 percent", expectedCorrect: true, label: "percent word accepted" },
    { itemId: "ret-fdp-001-a", answer: "20", expectedCorrect: false, label: "plain number is not a percent-only answer" },
    { itemId: "ret-rpr-005-a", answer: "$1.50", expectedCorrect: true, label: "currency decimal accepted" },
    { itemId: "ret-rpr-005-a", answer: "1.5", expectedCorrect: true, label: "trailing zero decimal equivalence accepted" },
    { itemId: "ret-rpr-005-a", answer: "15", expectedCorrect: false, label: "currency decimal near miss rejected" },
  ];

  for (const validationCase of cases) {
    const item = itemById(validationCase.itemId);
    const actual = gradeCorrect(item, validationCase.answer);
    assertCase(actual === validationCase.expectedCorrect, `${validationCase.itemId} ${validationCase.label}: expected ${validationCase.expectedCorrect ? "correct" : "incorrect"} for "${validationCase.answer}" but got ${actual ? "correct" : "incorrect"}`);
  }
}

function validateMatcherBoundaries() {
  const matcherCases: Array<[string, string, boolean, string]> = [
    ["360", "36", false, "plain integer must not match a longer integer"],
    ["36.0", "36", true, "equivalent decimal formatting should match"],
    ["$3", "3", true, "currency symbol should not block number matching"],
    ["30", "3", false, "short integer must not match substring"],
    ["Runner B", "B", true, "single letter should match as a word token"],
    ["because", "B", false, "single letter must not match inside a word"],
    ["4/16", "4/6", false, "fraction must not match inside a larger fraction"],
    ["4 : 6", "4:6", true, "ratio spacing should be tolerated"],
    ["24:60", "4:6", false, "ratio must not match inside a larger ratio"],
  ];

  for (const [answer, acceptedAnswer, expected, label] of matcherCases) {
    const actual = answerMatches(answer, acceptedAnswer);
    assertCase(actual === expected, `Matcher ${label}: expected ${expected} for answer "${answer}" vs accepted "${acceptedAnswer}" but got ${actual}`);
  }
}

validateAcceptedAnswers();
validateCommonWrongAnswers();
validateIntegerNearMisses();
validateRegressionCases();
validateMatcherBoundaries();

if (failures.length > 0) {
  console.error(`Item-bank validation failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Item-bank validation passed for ${itemBankSeeds.length} items.`);