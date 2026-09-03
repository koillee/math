import type { Prisma } from "@prisma/client";

type Signal = { id: string; reason: string; weight: number };

type Grade = {
  correctness: number;
  explanationScore: number;
  representationScore: number;
  transferScore: number;
  retentionSignal: number;
  confidenceCalibration: number;
  errorPattern: Record<string, unknown>;
  misconceptionSignals: Signal[];
  feedback: string;
};

const normalized = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const has = (value: string, terms: string[]) => terms.some((term) => value.includes(term));
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const sameNumber = (a: number, b: number) => Math.abs(a - b) < 1e-9;

type GenericItemForGrading = {
  itemId: string;
  itemType: string;
  acceptedAnswers: unknown;
  commonWrongAnswers: unknown;
  misconceptionIds: unknown;
  transferLevel: string;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function commonWrongAnswers(value: unknown): { answer: string; misconceptionId?: string; reason: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { answer?: unknown; misconceptionId?: unknown; reason?: unknown };
      const wrong: { answer: string; misconceptionId?: string; reason: string } = {
        answer: String(candidate.answer ?? ""),
        reason: String(candidate.reason ?? "Common wrong-answer pattern"),
      };
      if (candidate.misconceptionId) wrong.misconceptionId = String(candidate.misconceptionId);
      return wrong;
    })
    .filter((item): item is { answer: string; misconceptionId?: string; reason: string } => Boolean(item?.answer));
}

type NumericToken = { value: number; isPercent: boolean };

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNumericToken(value: string): NumericToken | null {
  const cleaned = normalized(value)
    .replace(/\$/g, "")
    .trim();
  if (!/^-?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)\s*(?:%|percent(?:age)?)?$/.test(cleaned)) return null;
  const isPercent = /(?:%|\bpercent(?:age)?\b)/.test(cleaned);
  const numberText = cleaned.replace(/,/g, "").replace(/(?:%|\bpercent(?:age)?\b)/g, "").replace(/\s+/g, "").trim();
  const valueNumber = Number(numberText);
  return Number.isFinite(valueNumber) ? { value: valueNumber, isPercent } : null;
}

function numericTokensIn(value: string): NumericToken[] {
  const tokens: NumericToken[] = [];
  const source = normalized(value);
  const tokenPattern = /(^|[^\w./-])(\$?-?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)\s*(?:%|percent|percentage)?)(?=$|[^\w./-])/g;
  let match = tokenPattern.exec(source);
  while (match !== null) {
    const parsed = parseNumericToken(match[2]);
    if (parsed) tokens.push(parsed);
    match = tokenPattern.exec(source);
  }
  return tokens;
}

function numericAnswerMatches(answer: string, acceptedAnswer: string) {
  const accepted = parseNumericToken(acceptedAnswer);
  if (!accepted) return false;
  return numericTokensIn(answer).some((token) => token.isPercent === accepted.isPercent && sameNumber(token.value, accepted.value));
}

function fractionAnswerMatches(answer: string, acceptedAnswer: string) {
  const accepted = normalized(acceptedAnswer).replace(/\s+/g, "");
  const fraction = accepted.match(/^-?\d+\/-?\d+$/)?.[0];
  if (!fraction) return false;
  const [numerator, denominator] = fraction.split("/").map(escapeRegex);
  return new RegExp(`(^|[^\\w./-])${numerator}\\s*\\/\\s*${denominator}(?=$|[^\\w./-])`).test(normalized(answer));
}

function ratioAnswerMatches(answer: string, acceptedAnswer: string) {
  const accepted = normalized(acceptedAnswer).replace(/\s+/g, "");
  const ratio = accepted.match(/^\d+:\d+$/)?.[0];
  if (!ratio) return false;
  const [left, right] = ratio.split(":").map(escapeRegex);
  return new RegExp(`(^|[^\\w.:-])${left}\\s*:\\s*${right}(?=$|[^\\w.:-])`).test(normalized(answer));
}

function canonicalText(value: string) {
  return normalized(value)
    .replace(/\$/g, "")
    .replace(/%/g, " percent ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textAnswerMatches(answer: string, acceptedAnswer: string) {
  const accepted = canonicalText(acceptedAnswer);
  if (!accepted) return false;
  return ` ${canonicalText(answer)} `.includes(` ${accepted} `);
}

export function answerMatches(answer: string, acceptedAnswer: string) {
  const accepted = normalized(acceptedAnswer);
  if (!accepted) return false;
  if (parseNumericToken(accepted)) return numericAnswerMatches(answer, accepted);
  if (/^-?\d+\s*\/\s*-?\d+$/.test(accepted)) return fractionAnswerMatches(answer, accepted);
  if (/^\d+\s*:\s*\d+$/.test(accepted)) return ratioAnswerMatches(answer, accepted);
  return textAnswerMatches(answer, accepted);
}

export function gradeItemBankItem(item: GenericItemForGrading, answerRaw: string, explanationRaw: string, confidence: number, representation?: string): Grade {
  if (item.itemType === "Diagnostic" && /^q(?:[1-9]|10)$/.test(item.itemId)) return gradeDiagnosticItem(item.itemId, answerRaw, explanationRaw, confidence, representation);

  const answer = normalized(answerRaw);
  const explanation = normalized(explanationRaw);
  const combined = `${answer} ${explanation}`;
  const accepted = stringArray(item.acceptedAnswers);
  const wrongAnswers = commonWrongAnswers(item.commonWrongAnswers);
  const mappedMisconceptions = stringArray(item.misconceptionIds);
  const correct = accepted.some((candidate) => answerMatches(answer, candidate));
  const signals: Signal[] = [];

  for (const wrong of wrongAnswers) {
    if (answerMatches(answer, wrong.answer) || (wrong.answer.length > 4 && combined.includes(normalized(wrong.answer)))) {
      if (wrong.misconceptionId) signals.push({ id: wrong.misconceptionId, reason: wrong.reason, weight: item.itemType === "Misconception Repair" ? 30 : 22 });
    }
  }

  if (!correct && signals.length === 0 && mappedMisconceptions.length > 0) {
    const baseWeight = item.itemType === "Misconception Repair" ? 24 : item.itemType === "Transfer" || item.itemType === "Challenge" ? 14 : 18;
    signals.push({ id: mappedMisconceptions[0], reason: `Response needs checking against ${item.itemType.toLowerCase()} misconception mapping`, weight: baseWeight });
  }

  const explanationTerms = ["because", "same", "equal", "place value", "thousand", "hundred", "hundreds", "hundredth", "hundredths", "tenth", "tenths", "whole", "of", "scale", "common", "factor", "multiple", "prime", "remainder", "inverse", "estimate", "operation", "negative", "zero", "per hundred", "quarter", "denominator", "numerator", "discount", "percent", "percentage", "class", "unit", "parts", "base", "multiply", "multiplication", "divide", "division", "ratio", "rate", "per", "proportion", "total parts"];
  const explanationScore = clamp((explanation.length > 25 ? 45 : 18) + (has(combined, explanationTerms) ? 32 : 0) + (correct ? 12 : 0));
  const representationScore = representation && representation !== "none" ? 78 : 45;
  const transferBase = item.transferLevel === "far" ? 86 : item.transferLevel === "medium" ? 78 : item.transferLevel === "near" ? 66 : 55;
  const transferScore = correct ? transferBase : item.transferLevel === "none" ? 15 : 25;
  const retentionSignal = item.itemType === "Retention" ? (correct ? 82 : 28) : correct ? 64 : 34;
  const confidenceCalibration = correct ? (confidence >= 3 ? 86 : 62) : confidence >= 4 ? 22 : 58;

  return {
    correctness: correct ? 100 : 0,
    explanationScore,
    representationScore,
    transferScore,
    retentionSignal,
    confidenceCalibration,
    errorPattern: correct ? {} : { itemId: item.itemId, answer: answerRaw, likely: signals.map((s) => s.id), itemType: item.itemType },
    misconceptionSignals: signals,
    feedback: correct ? "Good: this activity added positive evidence to the learning profile." : "This activity added useful evidence about what to review or repair next.",
  };
}

export function gradeDiagnosticItem(itemId: string, answerRaw: string, explanationRaw: string, confidence: number, representation?: string): Grade {
  const answer = normalized(answerRaw);
  const explanation = normalized(explanationRaw);
  const combined = `${answer} ${explanation}`;
  const signals: Signal[] = [];
  let correct = false;
  let feedback = "This gives us useful evidence for your learning profile.";

  switch (itemId) {
    case "q1":
      correct = answerMatches(answer, "1/4") || answerMatches(answer, "quarter");
      if (answerMatches(answer, "1/8") || has(combined, ["8 is bigger", "denominator is bigger", "bottom is bigger"])) signals.push({ id: "MISC-FRA-001", reason: "Compared denominators as whole numbers", weight: 32 });
      feedback = correct ? "Good: you identified the larger unit fraction." : "This suggests we should recheck unit fraction size.";
      break;
    case "q2":
      correct = answerMatches(answer, "7/12") || answerMatches(answer, "seven twelfths");
      if (answerMatches(answer, "2/7") || has(combined, ["add the bottom", "add denominators", "tops and bottoms"])) signals.push({ id: "MISC-FRA-002", reason: "Added numerators and denominators separately", weight: 38 });
      if (correct && !has(combined, ["same", "common", "equal", "twelfth", "denominator"])) signals.push({ id: "MISC-FRA-004", reason: "Correct answer without common-unit explanation", weight: 14 });
      feedback = correct ? "Your answer is correct; the explanation tells us how secure the common-denominator idea is." : "This is a high-value diagnostic item for fraction addition.";
      break;
    case "q3":
      correct = answerMatches(answer, "4/6") || answerMatches(answer, "four sixths");
      if (!correct || has(combined, ["different", "not same", "bigger numbers"])) signals.push({ id: "MISC-FRA-003", reason: "Equivalent fraction relationship uncertain", weight: 25 });
      feedback = correct ? "Good equivalent-fraction recognition." : "We should strengthen equivalent fractions before harder fraction work.";
      break;
    case "q4":
      correct = answerMatches(answer, "0.7") || answerMatches(answer, "seven tenths");
      if (answerMatches(answer, "0.56") || has(combined, ["56 is bigger", "more digits", "longer"])) signals.push({ id: "MISC-DEC-001", reason: "Compared decimal digits as whole numbers", weight: 35 });
      feedback = correct ? "Good decimal comparison evidence." : "This suggests decimal place value may need repair.";
      break;
    case "q5":
      correct = answerMatches(answer, "20") || answerMatches(answer, "twenty");
      if (/(^|\D)25(\D|$)/.test(answer) || has(combined, ["25 percent means 25", "just 25"])) signals.push({ id: "MISC-PCT-001", reason: "Treated percent as a whole number", weight: 32 });
      feedback = correct ? "Good use of benchmark percentage." : "We should check percent as parts per hundred.";
      break;
    case "q6":
      correct = answerMatches(answer, "class b") || answerMatches(answer, "b") || answerMatches(answer, "40") || answerMatches(answer, "40%");
      if (answerMatches(answer, "class a") || has(combined, ["18 is more", "more students", "bigger number"])) signals.push({ id: "MISC-PCT-004", reason: "Compared raw counts instead of percentages", weight: 32 });
      if (!correct) signals.push({ id: "MISC-PCT-002", reason: "Percentage base may be unclear", weight: 18 });
      feedback = correct ? "Good percentage comparison across unequal totals." : "This item checks whether the whole/base is clear.";
      break;
    case "q7":
      correct = answerMatches(answer, "5") || answerMatches(answer, "five dollars");
      if (/(^|\D)10(\D|$)/.test(answer) || /(\$?40)/.test(answer)) signals.push({ id: "MISC-PCT-003", reason: "Discount interpreted additively or as final price confusion", weight: 26 });
      if (!correct) signals.push({ id: "MISC-PCT-001", reason: "10% of a quantity uncertain", weight: 14 });
      feedback = correct ? "Good: you used percent as an operator on a quantity." : "We should check the difference between percent amount and final price.";
      break;
    case "q8":
      correct = ((answerMatches(answer, "0.75") || answerMatches(answer, ".75")) && (answerMatches(answer, "75%") || answerMatches(answer, "75 percent"))) || answerMatches(answer, "75/100");
      if (!correct) signals.push({ id: "MISC-FRA-003", reason: "Fraction-decimal-percent equivalence uncertain", weight: 15 });
      feedback = correct ? "Strong FDP equivalence evidence." : "FDP equivalence needs more evidence.";
      break;
    case "q9":
      correct = answerMatches(answer, "18") || answerMatches(answer, "eighteen");
      if (correct && !has(combined, ["half", "divide", "two", "equal", "scale", "of means"])) signals.push({ id: "MISC-FRA-006", reason: "Correct fraction-of answer with limited operator explanation", weight: 12 });
      if (!correct) signals.push({ id: "MISC-FRA-006", reason: "Fraction as operator may be weak", weight: 24 });
      feedback = correct ? "Good fraction-as-operator evidence." : "This checks whether fractions can act on quantities.";
      break;
    case "q10":
      correct = answerMatches(answer, "340") || answerMatches(answer, "three hundred forty");
      if (!correct || has(combined, ["add zero", "3.400", "3.40"])) signals.push({ id: "MISC-DEC-002", reason: "Decimal place-value scaling uncertain", weight: 24 });
      feedback = correct ? "Good decimal scaling evidence." : "We should strengthen decimal place-value scaling.";
      break;
  }

  const explanationTerms = ["because", "same", "equal", "place value", "hundred", "hundreds", "hundredth", "hundredths", "tenth", "tenths", "whole", "of", "scale", "common", "per hundred", "quarter", "denominator", "numerator", "discount", "percent", "percentage", "class"];
  const explanationScore = clamp((explanation.length > 20 ? 45 : 18) + (has(combined, explanationTerms) ? 35 : 0) + (correct ? 10 : 0));
  const representationScore = representation && representation !== "none" ? 75 : 45;
  const transferScore = ["q6", "q7", "q9"].includes(itemId) ? (correct ? 75 : 25) : correct ? 55 : 15;
  const retentionSignal = correct ? 65 : 35;
  const confidenceCalibration = correct ? (confidence >= 3 ? 86 : 62) : confidence >= 4 ? 22 : 58;
  return {
    correctness: correct ? 100 : 0,
    explanationScore,
    representationScore,
    transferScore,
    retentionSignal,
    confidenceCalibration,
    errorPattern: correct ? {} : { itemId, answer: answerRaw, likely: signals.map((s) => s.id) },
    misconceptionSignals: signals,
    feedback,
  };
}

export function masteryLevelFromScores(scores: { accuracyScore: number; explanationScore: number; representationScore: number; transferScore: number; retentionScore: number; misconceptionRiskScore: number; evidenceCount: number }) {
  const { accuracyScore, explanationScore, representationScore, transferScore, retentionScore, misconceptionRiskScore, evidenceCount } = scores;
  if (accuracyScore >= 90 && explanationScore >= 85 && representationScore >= 80 && transferScore >= 75 && retentionScore >= 80 && misconceptionRiskScore <= 10 && evidenceCount >= 4) return { level: 5, state: "Mastered" };
  if (accuracyScore >= 82 && explanationScore >= 70 && transferScore >= 60 && retentionScore >= 65 && misconceptionRiskScore <= 25 && evidenceCount >= 2) return { level: 4, state: "Ready To Advance" };
  if (accuracyScore >= 75 && explanationScore >= 55 && misconceptionRiskScore <= 45) return { level: 3, state: retentionScore < 60 ? "Review Needed" : "Secure" };
  if (accuracyScore >= 45 || evidenceCount > 0) return { level: 2, state: "Practicing" };
  return { level: 1, state: "Not Learned" };
}

export function retentionCategory(score: number) {
  if (score < 40) return "Fragile";
  if (score < 60) return "At Risk";
  if (score < 75) return "Maintaining";
  if (score < 90) return "Strong";
  return "Durable";
}

export function nextReviewDate(score: number) {
  const days = score < 40 ? 2 : score < 60 ? 4 : score < 75 ? 7 : score < 90 ? 21 : 45;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function misconceptionStatus(probability: number) {
  if (probability >= 80) return "active";
  if (probability >= 60) return "likely";
  if (probability >= 35) return "suspected";
  return "possible";
}

export function recommendationCopy(action: string, skill?: string | null, misconception?: { name: string; id: string } | null) {
  if (action === "Misconception Repair" && misconception) {
    return {
      student: "Let’s pause and check one idea carefully before moving ahead.",
      parent: `The system noticed a possible pattern: ${misconception.name}. The next step is a short concept check, not more repetitive practice.`,
      internal: `Priority severe misconception signal: ${misconception.id}`,
    };
  }
  if (action === "Review") {
    return {
      student: `A quick review of ${skill ?? "a core skill"} will help make it stick.` ,
      parent: "Your child is ready for a short review to strengthen retention before moving ahead.",
      internal: "Retention or mastery score below review threshold.",
    };
  }
  if (action === "Transfer Challenge") {
    return {
      student: "You’re ready to try this idea in a new situation.",
      parent: "Your child is becoming secure; the next step is transfer to unfamiliar contexts.",
      internal: "Secure accuracy with transfer still developing.",
    };
  }
  return {
    student: `Next, continue building ${skill ?? "the current focus skill"}.`,
    parent: "The next step is targeted practice based on diagnostic evidence.",
    internal: "Default current-skill recommendation.",
  };
}

export type EvidenceCreate = Prisma.EvidenceEventCreateManyInput;
