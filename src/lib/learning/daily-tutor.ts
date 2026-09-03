type CommonWrongAnswer = { answer: string; misconceptionId?: string; reason?: string };

export type TutorItemLike = {
  itemId: string;
  skillNodeId: string;
  title: string;
  prompt: string;
  expectedAnswer: string;
  acceptedAnswers: unknown;
  commonWrongAnswers: unknown;
  explanationRubric?: unknown;
};

export type Choice = {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
};

export type RetryPrompt = {
  prompt: string;
  choices: Choice[];
  explanation: string;
};

export type TutorTopic = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  schoolLink: string;
  miniLesson: string[];
  workedExample: {
    problem: string;
    steps: string[];
    answer: string;
  };
  parentFocus: string;
};

const phase2Prefixes = ["pv2-", "pat2-", "md2-", "dec2-", "pow2-"];

export function isPhase2SchoolAlignedItem(item: Pick<TutorItemLike, "itemId" | "skillNodeId">) {
  return phase2Prefixes.some((prefix) => item.itemId.startsWith(prefix)) || ["NUM-001", "NUM-002", "NUM-003", "NUM-004", "NUM-005", "NUM-006", "NUM-008", "DEC-001", "DEC-003", "DEC-004", "DEC-005"].includes(item.skillNodeId);
}

export const tutorTopics: TutorTopic[] = [
  {
    id: "place-value-review",
    title: "Place value review",
    shortTitle: "Place value",
    subtitle: "Read digits by their position, not just by their face value.",
    schoolLink: "This matches school’s next focus: reviewing place value before moving on.",
    miniLesson: [
      "A digit changes value depending on where it sits. The 7 in 70,000 is much larger than the 7 in 700.",
      "Use columns to slow down: millions, hundred-thousands, ten-thousands, thousands, hundreds, tens, ones.",
      "When you compare or round numbers, look at the important column first instead of reading the digits like a word.",
    ],
    workedExample: {
      problem: "In 572,418, what is the value of the 7?",
      steps: ["Write the columns: 5 is hundred-thousands, 7 is ten-thousands, 2 is thousands.", "The 7 is in the ten-thousands place.", "7 ten-thousands means 70,000."],
      answer: "70,000",
    },
    parentFocus: "Haim is reviewing large-number place value, digit value, comparing, and rounding.",
  },
  {
    id: "patterns-and-missing-numbers",
    title: "Patterns and missing numbers",
    shortTitle: "Patterns",
    subtitle: "Spot the rule, then use multiplication or division to find the missing part.",
    schoolLink: "This matches the recent class work on maths puzzles, grids, riddles, multiplication, and division.",
    miniLesson: [
      "A puzzle usually has a hidden rule. Before calculating, ask: what is staying the same? what is changing?",
      "For a missing number, use the opposite operation to undo the clue. Multiplication can be undone with division.",
      "Check your answer by putting it back into the original puzzle.",
    ],
    workedExample: {
      problem: "Find the missing number: 6 × □ = 72",
      steps: ["The box is being multiplied by 6.", "Undo multiplication by dividing: 72 ÷ 6 = 12.", "Check: 6 × 12 = 72."],
      answer: "12",
    },
    parentFocus: "Haim is practising school-style puzzles that use multiplication, division, missing numbers, and step-by-step checking.",
  },
  {
    id: "multiplication-division",
    title: "Multiplication and division strategies",
    shortTitle: "Multiply & divide",
    subtitle: "Break numbers apart, calculate carefully, and check with the inverse operation.",
    schoolLink: "This supports the class puzzle work that used multiplication and division inside multi-step problems.",
    miniLesson: [
      "Multiplication and division are connected. You can use one to check the other.",
      "For larger multiplication, partition the number into easier parts, then add the partial products.",
      "For division with a context, always ask what the remainder means.",
    ],
    workedExample: {
      problem: "Calculate 24 × 15.",
      steps: ["Split 15 into 10 and 5.", "24 × 10 = 240 and 24 × 5 = 120.", "240 + 120 = 360."],
      answer: "360",
    },
    parentFocus: "Haim is building reliable multiplication/division strategies and checking habits.",
  },
  {
    id: "decimal-place-value",
    title: "Decimal place value",
    shortTitle: "Decimals",
    subtitle: "Tenths, hundredths, and thousandths are place-value columns too.",
    schoolLink: "This connects the school place-value review to decimals, where many common mistakes happen.",
    miniLesson: [
      "Digits after the decimal point also have places: tenths, hundredths, thousandths.",
      "0.47 is 47 hundredths. 0.407 is 407 thousandths, which is slightly more than 0.4 but less than 0.47.",
      "Adding extra zeros at the end does not change a decimal’s value: 0.7 = 0.70 = 0.700.",
    ],
    workedExample: {
      problem: "Which is larger: 0.407 or 0.47?",
      steps: ["Write 0.47 as 0.470 so both numbers show thousandths.", "Compare 407 thousandths with 470 thousandths.", "470 thousandths is larger."],
      answer: "0.47",
    },
    parentFocus: "Haim is connecting whole-number place value to decimal columns and decimal comparison.",
  },
  {
    id: "powers-of-ten",
    title: "Powers of 10",
    shortTitle: "×10, ×100, ×1000",
    subtitle: "Multiplying or dividing by 10, 100, and 1000 changes the value of every digit.",
    schoolLink: "This strengthens place-value review and directly targets mistakes like moving one place too far.",
    miniLesson: [
      "When multiplying by 10, 100, or 1000, the digits move to larger place-value columns.",
      "When dividing by 10, 100, or 1000, the digits move to smaller place-value columns.",
      "Do not just ‘add zeros’. Ask how many place-value positions the digits move.",
    ],
    workedExample: {
      problem: "Calculate 0.036 × 1000.",
      steps: ["×1000 means three place-value moves larger.", "0.036 → 0.36 → 3.6 → 36.", "The answer is 36, not 360."],
      answer: "36",
    },
    parentFocus: "Haim is practising decimal scaling with powers of 10 and explaining the place-value movement.",
  },
];

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function commonWrongAnswers(value: unknown): CommonWrongAnswer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): CommonWrongAnswer | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { answer?: unknown; misconceptionId?: unknown; reason?: unknown };
      const answer = String(candidate.answer ?? "").trim();
      if (!answer) return null;
      const wrong: CommonWrongAnswer = { answer };
      if (candidate.misconceptionId) wrong.misconceptionId = String(candidate.misconceptionId);
      if (candidate.reason) wrong.reason = String(candidate.reason);
      return wrong;
    })
    .filter((item): item is CommonWrongAnswer => Boolean(item));
}

function simpleKey(value: string) {
  return value.toLowerCase().replace(/[$,]/g, "").replace(/\s+/g, " ").trim();
}

function hash(value: string) {
  let total = 0;
  for (const char of value) total = (total * 31 + char.charCodeAt(0)) % 9973;
  return total;
}

function deterministicShuffle<T extends { label: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => ((hash(`${seed}:${a.label}`) % 1000) - (hash(`${seed}:${b.label}`) % 1000)) || a.label.localeCompare(b.label));
}

function numericValue(value: string) {
  const cleaned = value.replace(/[$,%]/g, "").replace(/,/g, "").trim();
  return /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(cleaned) ? Number(cleaned) : null;
}

function generatedDistractors(item: TutorItemLike, correctAnswer: string): CommonWrongAnswer[] {
  const n = numericValue(correctAnswer);
  if (n !== null && Number.isFinite(n)) {
    const hasPercent = /%|percent/i.test(correctAnswer);
    const format = (value: number) => `${Number(value.toFixed(3))}${hasPercent ? "%" : ""}`;
    return [
      { answer: format(n * 10), reason: "This often means the place-value move went one step too far." },
      { answer: format(n / 10), reason: "This often means the place-value move did not go far enough." },
      { answer: format(n + 1), reason: "This is close, but it does not satisfy the exact calculation." },
    ];
  }
  if (item.skillNodeId.includes("NUM-001")) return [{ answer: "The digit only", reason: "A digit's value depends on its place, not only the digit itself." }];
  if (item.skillNodeId.includes("NUM-008")) return [{ answer: "Use the same operation again", reason: "Missing-number problems usually need the inverse operation to undo the clue." }];
  return [
    { answer: "Not enough information", reason: "The question gives enough information; the key is choosing the correct relationship." },
    { answer: "The largest number shown", reason: "The largest visible number is not always the answer." },
  ];
}

export function buildChoiceSet(item: TutorItemLike): Choice[] {
  const accepted = stringArray(item.acceptedAnswers);
  const correctAnswer = accepted[0] ?? item.expectedAnswer.split(/[.;]/)[0]?.trim() ?? "Correct answer";
  const wrongAnswers = [...commonWrongAnswers(item.commonWrongAnswers), ...generatedDistractors(item, correctAnswer)];
  const choices: Choice[] = [{ id: "correct", label: correctAnswer, correct: true, feedback: "Correct — that matches the key idea for this question." }];
  const used = new Set([simpleKey(correctAnswer)]);

  for (const wrong of wrongAnswers) {
    if (choices.length >= 4) break;
    const key = simpleKey(wrong.answer);
    if (!key || used.has(key)) continue;
    used.add(key);
    choices.push({
      id: `wrong-${choices.length}`,
      label: wrong.answer,
      correct: false,
      feedback: wrong.reason ?? "This is a common answer, but it misses the key relationship in the question.",
    });
  }

  return deterministicShuffle(choices, item.itemId).map((choice, index) => ({ ...choice, id: `${String.fromCharCode(65 + index)}-${choice.id}` }));
}

export function getTutorTopicForItems(items: Array<Pick<TutorItemLike, "itemId" | "skillNodeId">>): TutorTopic {
  const counts = new Map<string, number>();
  const score = (topicId: string, amount = 1) => counts.set(topicId, (counts.get(topicId) ?? 0) + amount);
  for (const item of items) {
    if (item.itemId.startsWith("pv2-") || ["NUM-001", "NUM-002"].includes(item.skillNodeId)) score("place-value-review", item.itemId.startsWith("pv2-") ? 3 : 1);
    if (item.itemId.startsWith("pat2-") || ["NUM-005", "NUM-006", "NUM-008"].includes(item.skillNodeId)) score("patterns-and-missing-numbers", item.itemId.startsWith("pat2-") ? 3 : 1);
    if (item.itemId.startsWith("md2-") || ["NUM-003", "NUM-004"].includes(item.skillNodeId)) score("multiplication-division", item.itemId.startsWith("md2-") ? 3 : 1);
    if (item.itemId.startsWith("dec2-") || ["DEC-001", "DEC-002", "DEC-003"].includes(item.skillNodeId)) score("decimal-place-value", item.itemId.startsWith("dec2-") ? 3 : 1);
    if (item.itemId.startsWith("pow2-") || ["DEC-004", "DEC-005"].includes(item.skillNodeId)) score("powers-of-ten", item.itemId.startsWith("pow2-") ? 3 : 1);
  }
  const selectedId = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "place-value-review";
  return tutorTopics.find((topic) => topic.id === selectedId) ?? tutorTopics[0];
}

export function buildRetryPrompt(item: TutorItemLike, selectedAnswer: string): RetryPrompt {
  const bySkill: Record<string, RetryPrompt> = {
    "NUM-001": {
      prompt: "Try a similar one: In 84,216, what is the value of the 8?",
      choices: ["8", "800", "8,000", "80,000"].map((label) => ({ id: label, label, correct: label === "80,000", feedback: label === "80,000" ? "Yes — 8 is in the ten-thousands place." : "Check the column of the 8 before choosing." })),
      explanation: "The 8 is in the ten-thousands column, so it means 80,000.",
    },
    "NUM-002": {
      prompt: "Try a similar one: Round 63,851 to the nearest thousand.",
      choices: ["63,000", "64,000", "63,900", "60,000"].map((label) => ({ id: label, label, correct: label === "64,000", feedback: label === "64,000" ? "Yes — 851 means it rounds up to 64,000." : "Look at the hundreds digit to decide whether 63,000 rounds up." })),
      explanation: "The hundreds digit is 8, so 63,851 rounds up to 64,000.",
    },
    "NUM-003": {
      prompt: "Try a similar one: Calculate 32 × 6.",
      choices: ["182", "192", "212", "36"].map((label) => ({ id: label, label, correct: label === "192", feedback: label === "192" ? "Yes — 30×6 plus 2×6 is 192." : "Partition 32 into 30 and 2, then multiply each part by 6." })),
      explanation: "32 × 6 = 30 × 6 + 2 × 6 = 180 + 12 = 192.",
    },
    "NUM-004": {
      prompt: "Try a similar one: 78 ÷ 6 = ?",
      choices: ["12", "13", "14", "468"].map((label) => ({ id: label, label, correct: label === "13", feedback: label === "13" ? "Yes — 6×13 is 78." : "Use multiplication to check the division." })),
      explanation: "78 ÷ 6 = 13 because 6 × 13 = 78.",
    },
    "NUM-008": {
      prompt: "Try a similar one: Find the missing number: 7 × □ = 63.",
      choices: ["7", "8", "9", "56"].map((label) => ({ id: label, label, correct: label === "9", feedback: label === "9" ? "Yes — 63 ÷ 7 = 9." : "Undo ×7 by dividing 63 by 7." })),
      explanation: "The missing number is 9 because 7 × 9 = 63.",
    },
    "DEC-001": {
      prompt: "Try a similar one: In 2.405, what is the value of the 4?",
      choices: ["4", "0.4", "0.04", "0.004"].map((label) => ({ id: label, label, correct: label === "0.4", feedback: label === "0.4" ? "Yes — 4 is in the tenths place." : "Look at the first place after the decimal point." })),
      explanation: "The 4 is in the tenths place, so its value is 0.4.",
    },
    "DEC-003": {
      prompt: "Try a similar one: Round 5.46 to one decimal place.",
      choices: ["5.4", "5.5", "5.46", "6"].map((label) => ({ id: label, label, correct: label === "5.5", feedback: label === "5.5" ? "Yes — the hundredths digit 6 rounds the tenths up." : "For one decimal place, keep tenths and look at hundredths." })),
      explanation: "5.46 rounds to 5.5 because the hundredths digit is 6.",
    },
    "DEC-004": {
      prompt: "Try a similar one: Calculate 0.052 × 1000.",
      choices: ["0.052000", "5.2", "52", "520"].map((label) => ({ id: label, label, correct: label === "52", feedback: label === "52" ? "Yes — the digits move three places larger." : "Count three place-value moves: 0.052 → 0.52 → 5.2 → 52." })),
      explanation: "0.052 × 1000 = 52 after three place-value moves larger.",
    },
    "DEC-005": {
      prompt: "Try a similar one: Calculate 6.4 ÷ 100.",
      choices: ["640", "0.64", "0.064", "0.0064"].map((label) => ({ id: label, label, correct: label === "0.064", feedback: label === "0.064" ? "Yes — the digits move two places smaller." : "Dividing by 100 moves two place-value positions smaller." })),
      explanation: "6.4 ÷ 100 = 0.064 because every digit moves two places smaller.",
    },
  };

  const retry = bySkill[item.skillNodeId] ?? bySkill["NUM-008"];
  return {
    ...retry,
    explanation: `You chose ${selectedAnswer}. ${retry.explanation}`,
  };
}

export function buildMistakeFeedback(item: TutorItemLike, selectedAnswer: string) {
  const wrong = commonWrongAnswers(item.commonWrongAnswers).find((candidate) => simpleKey(candidate.answer) === simpleKey(selectedAnswer));
  return wrong?.reason ?? "This answer is a useful clue. Recheck the key idea, then try the similar problem below.";
}