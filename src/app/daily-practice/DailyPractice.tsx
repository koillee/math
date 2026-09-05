"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Topic = "multiplication" | "fractions" | "decimals" | "percentages";
type Stage = "goals" | "lesson" | "practice" | "gugudan" | "summary";
type Question = {
  id: string;
  topic: Topic;
  label: string;
  prompt: string;
  choices: string[];
  answer: string;
  answerType?: "exact" | "fraction-equivalent";
  hint: string;
  explanation: string;
  parentNote: string;
};

type SessionRecord = {
  date: string;
  topic: Topic;
  total: number;
  correct: number;
  needsReview: Topic[];
};

type Template = {
  topic: Topic;
  label: string;
  build: (seed: number) => Question;
};

const progressKey = "haim-daily-practice-progress-v2";

const topicLabels: Record<Topic, string> = {
  multiplication: "Multiplication & division",
  fractions: "Fractions",
  decimals: "Decimals",
  percentages: "Percentages",
};

const stageOrder: Stage[] = ["goals", "lesson", "practice", "gugudan"];

const topicLessons: Record<
  Topic,
  {
    goal: string;
    bigIdea: string;
    steps: string[];
    example: string;
    trap: string;
    recaps: {
      title: string;
      bigIdea: string;
      steps: string[];
      example: string;
      trap: string;
    }[];
  }
> = {
  multiplication: {
    goal: "Use fact families to connect multiplication, division, and missing numbers.",
    bigIdea:
      "Multiplication and division are opposites. If you know one fact, you can use it in several ways.",
    steps: [
      "Find the equal groups.",
      "Write the multiplication fact.",
      "Use the opposite operation when a number is missing.",
    ],
    example: "If 7 x 8 = 56, then 56 / 7 = 8 and 56 / 8 = 7.",
    trap: "Do not guess division. Ask which multiplication fact makes the total.",
    recaps: [
      {
        title: "Fact families give free answers",
        bigIdea:
          "One multiplication fact can unlock two division facts and a missing-number problem.",
        steps: [
          "Start with the multiplication fact.",
          "Swap the factors to get the turn-around fact.",
          "Use the total divided by one factor to find the other factor.",
        ],
        example: "7 x 8 = 56, so 8 x 7 = 56, 56 / 7 = 8, and 56 / 8 = 7.",
        trap: "Do not treat division as a new fact to memorize every time.",
      },
      {
        title: "Equal groups tell you what to do",
        bigIdea:
          "When a story has the same amount repeated, multiplication finds the total.",
        steps: [
          "Circle how many groups there are.",
          "Underline how many are in each group.",
          "Multiply groups by group size.",
        ],
        example: "6 bags with 8 stickers each means 6 x 8 = 48 stickers.",
        trap: "Adding 6 + 8 only finds two numbers together, not six equal groups.",
      },
      {
        title: "Missing numbers are hidden division",
        bigIdea:
          "A missing factor asks which number makes the multiplication fact true.",
        steps: [
          "Read the total at the end.",
          "Divide the total by the known factor.",
          "Check by multiplying back.",
        ],
        example: "9 x ? = 63 means 63 / 9 = 7, so the missing number is 7.",
        trap: "Guessing can feel fast, but checking with division is calmer.",
      },
    ],
  },
  fractions: {
    goal: "Understand fractions as equal parts and use the denominator first.",
    bigIdea:
      "The denominator tells how many equal parts make the whole. The numerator tells how many parts we use.",
    steps: [
      "Ask what the whole is.",
      "Split the whole by the denominator.",
      "Take or count the numerator parts.",
    ],
    example: "3/4 of 20: first 20 / 4 = 5, then 3 x 5 = 15.",
    trap: "Do not look only at the numbers. Check the size of the equal parts.",
    recaps: [
      {
        title: "Denominator first",
        bigIdea:
          "The denominator tells how many equal parts make the whole, so it usually tells the first action.",
        steps: [
          "Name the whole.",
          "Split it by the denominator.",
          "Take the numerator number of parts.",
        ],
        example: "3/4 of 20: 20 / 4 = 5, then 3 x 5 = 15.",
        trap: "Starting with the numerator can hide what the equal parts are.",
      },
      {
        title: "Compare the size of pieces",
        bigIdea:
          "With the same whole, more equal slices means each slice is smaller.",
        steps: [
          "Check the whole is the same.",
          "Compare how many equal parts it is split into.",
          "Use a bar drawing if your eyes are unsure.",
        ],
        example: "1/4 is larger than 1/8 because fourths are bigger pieces.",
        trap: "A bigger denominator does not mean a bigger fraction.",
      },
      {
        title: "Equivalent fractions cover the same amount",
        bigIdea:
          "Equivalent fractions can look different but take up the same space on the same whole.",
        steps: [
          "Draw two same-length bars.",
          "Split them in different ways.",
          "Check whether the shaded amount lines up.",
        ],
        example: "1/2 and 2/4 are equal because they both cover half the bar.",
        trap: "Changing only the top or only the bottom changes the fraction.",
      },
    ],
  },
  decimals: {
    goal: "Use place-value columns to compare decimals and scale by 10, 100, or 1000.",
    bigIdea:
      "Decimals are place value for parts smaller than one: tenths, hundredths, and thousandths.",
    steps: [
      "Line up the decimal places.",
      "Use zeros at the end to compare if helpful.",
      "For x10, x100, and x1000, move digits through columns.",
    ],
    example: "0.7 is 0.70, so it is 70 hundredths and greater than 0.56.",
    trap: "More decimal digits does not always mean the number is bigger.",
    recaps: [
      {
        title: "Line up the decimal point",
        bigIdea:
          "Decimal places are columns. Lining up the decimal point lines up the place values.",
        steps: [
          "Write the numbers one above the other.",
          "Line up the decimal points.",
          "Add zeros at the end only if they help you compare.",
        ],
        example: "0.7 = 0.70, so 0.70 is greater than 0.56.",
        trap: "Do not compare 7 and 56 as whole numbers.",
      },
      {
        title: "Decimals are parts of one",
        bigIdea:
          "Tenths, hundredths, and thousandths are smaller place-value columns after the decimal point.",
        steps: [
          "Say the number using place-value words.",
          "Find the tenths column first.",
          "Then compare hundredths and thousandths if needed.",
        ],
        example: "0.47 means forty-seven hundredths.",
        trap: "Reading 0.47 as 'zero point four seven' can hide the place value.",
      },
      {
        title: "Multiplying by 10 moves place value",
        bigIdea:
          "When multiplying or dividing by 10, 100, or 1000, digits move through columns.",
        steps: [
          "Count how many zeros are in 10, 100, or 1000.",
          "Move that many place-value columns.",
          "Check whether the number should become larger or smaller.",
        ],
        example: "0.036 x 1000 = 36.",
        trap: "Just adding zeros can give a very wrong decimal answer.",
      },
    ],
  },
  percentages: {
    goal: "Use benchmark percentages and always identify the whole.",
    bigIdea:
      "Percent means out of 100. A percentage only makes sense when we know the whole it refers to.",
    steps: [
      "Ask: percent of what whole?",
      "Use benchmarks: 50% is half, 25% is a quarter, 10% is one tenth.",
      "Check whether the question asks for the amount or the final value.",
    ],
    example: "25% of 80 means one quarter of 80, so 80 / 4 = 20.",
    trap: "Do not treat the percent number itself as the answer.",
    recaps: [
      {
        title: "Percent means out of 100",
        bigIdea:
          "A percent is a fraction with 100 as the whole, so it always needs a whole amount.",
        steps: [
          "Ask: percent of what?",
          "Turn the percent into a benchmark if possible.",
          "Find the amount from the whole.",
        ],
        example: "25% of 80 is one quarter of 80, which is 20.",
        trap: "25% is not 25 unless the whole is 100.",
      },
      {
        title: "Use friendly benchmarks",
        bigIdea:
          "Many percentages become easy when you know 50%, 25%, 10%, and 5%.",
        steps: [
          "50% means half.",
          "25% means one quarter.",
          "10% means one tenth, and 5% is half of 10%.",
        ],
        example: "5% of 60: 10% is 6, so 5% is 3.",
        trap: "Do not reach for a long method when a benchmark works.",
      },
      {
        title: "Discounts have two answers to watch",
        bigIdea:
          "A discount question may ask for the discount amount or the final sale price.",
        steps: [
          "Find the discount amount.",
          "Read whether the question asks for the amount off or final price.",
          "Subtract the discount from the original price for sale price.",
        ],
        example: "25% off HK$40 is HK$10 off, so the sale price is HK$30.",
        trap: "Stopping at the discount amount when the question asks for sale price.",
      },
    ],
  },
};

function daySeed() {
  const now = new Date();
  return Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
  );
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function pick<T>(items: readonly T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function options(answer: number, distractors: number[]) {
  const unique = Array.from(
    new Set(
      [answer, ...distractors].filter(
        (value) => Number.isFinite(value) && value > 0,
      ),
    ),
  );
  for (let offset = 1; unique.length < 4 && offset < 20; offset += 1) {
    const lower = answer - offset;
    const higher = answer + offset;
    if (lower > 0 && !unique.includes(lower)) unique.push(lower);
    if (!unique.includes(higher)) unique.push(higher);
  }
  return unique
    .slice(0, 4)
    .map(String)
    .sort(
      (left, right) =>
        ((Number(left) * 13 + answer) % 7) -
        ((Number(right) * 13 + answer) % 7),
    );
}

function parseFraction(value: string) {
  const match = value.trim().match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (denominator === 0) return null;
  return { numerator, denominator };
}

function sameFraction(left: string, right: string) {
  const a = parseFraction(left);
  const b = parseFraction(right);
  if (!a || !b) return false;
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

export function isAnswerCorrect(question: Question, selected: string) {
  if (question.answerType === "fraction-equivalent") {
    return sameFraction(question.answer, selected);
  }
  return selected === question.answer;
}

function validateQuestion(question: Question) {
  const uniqueChoices = Array.from(new Set(question.choices));
  const correctChoices = uniqueChoices.filter((choice) =>
    isAnswerCorrect(question, choice),
  );
  if (correctChoices.length !== 1 || correctChoices[0] !== question.answer) {
    throw new Error(
      `Invalid choices for ${question.id}: expected only ${question.answer}, got ${correctChoices.join(", ")}`,
    );
  }
  return { ...question, choices: uniqueChoices };
}

const templates: Template[] = [
  {
    topic: "multiplication",
    label: "Fact family",
    build(seed) {
      const facts = [
        [6, 7],
        [7, 8],
        [8, 6],
        [9, 7],
      ];
      const [a, b] = pick(facts, seed);
      const total = a * b;
      return {
        id: `fact-family-${a}-${b}`,
        topic: "multiplication",
        label: "Fact family",
        prompt: `If ${a} x ${b} = ${total}, what is ${total} / ${a}?`,
        choices: options(b, [a, b + 1, b - 1, total - a]),
        answer: String(b),
        hint: "Use the same fact family. Division undoes multiplication.",
        explanation: `${a} groups of ${b} make ${total}, so ${total} split into ${a} equal groups gives ${b}.`,
        parentNote: "Ask Haim to say the full fact family aloud.",
      };
    },
  },
  {
    topic: "multiplication",
    label: "Story problem",
    build(seed) {
      const cases = [
        [8, 6, "gymnastics ribbons"],
        [7, 9, "cheer practice counts"],
        [6, 8, "taekwondo kick sets"],
        [9, 4, "craft beads"],
      ] as const;
      const [groups, size, item] = pick(cases, seed + 4);
      const answer = groups * size;
      return {
        id: `story-multiply-${groups}-${size}`,
        topic: "multiplication",
        label: "Story problem",
        prompt: `Haim has ${groups} groups of ${size} ${item}. How many ${item} altogether?`,
        choices: options(answer, [
          groups + size,
          answer - groups,
          answer + size,
          groups * (size - 1),
        ]),
        answer: String(answer),
        hint: "Equal groups usually means multiplication.",
        explanation: `${groups} equal groups of ${size} means ${groups} x ${size} = ${answer}.`,
        parentNote:
          "Ask whether the answer is a total, a group size, or a number of groups.",
      };
    },
  },
  {
    topic: "multiplication",
    label: "Missing number",
    build(seed) {
      const facts = [
        [7, 6],
        [8, 7],
        [6, 9],
        [8, 8],
      ];
      const [a, b] = pick(facts, seed + 3);
      const total = a * b;
      return {
        id: `missing-${a}-${b}`,
        topic: "multiplication",
        label: "Missing number",
        prompt: `${a} x ? = ${total}`,
        choices: options(b, [a, b - 2, b + 2, total / 2]),
        answer: String(b),
        hint: `Ask: ${total} divided by ${a} equals what?`,
        explanation: `The missing number is ${b}, because ${a} x ${b} = ${total}.`,
        parentNote:
          "Missing-number problems become easier when she uses the inverse operation.",
      };
    },
  },
  {
    topic: "fractions",
    label: "Fraction of an amount",
    build(seed) {
      const cases = [
        [1, 4, 28],
        [3, 4, 20],
        [2, 5, 30],
        [3, 8, 32],
      ];
      const [num, den, whole] = pick(cases, seed + 5);
      const unit = whole / den;
      const answer = unit * num;
      return {
        id: `fraction-amount-${num}-${den}-${whole}`,
        topic: "fractions",
        label: "Fraction of an amount",
        prompt: `What is ${num}/${den} of ${whole}?`,
        choices: options(answer, [
          unit,
          whole - answer,
          answer + den,
          den * num,
        ]),
        answer: String(answer),
        hint: `First find 1/${den} by doing ${whole} / ${den}.`,
        explanation: `${whole} / ${den} = ${unit}, so ${num}/${den} is ${num} x ${unit} = ${answer}.`,
        parentNote: "Ask: what does the denominator tell us to do first?",
      };
    },
  },
  {
    topic: "fractions",
    label: "Equivalent fractions",
    build(seed) {
      const cases = [
        ["1/2", "2/4", "3/4", "1/3"],
        ["2/3", "4/6", "2/6", "3/6"],
        ["3/5", "6/10", "3/10", "5/10"],
        ["1/4", "2/8", "4/8", "3/8"],
      ] as const;
      const [base, answer, distractorA, distractorB] = pick(cases, seed + 9);
      return {
        id: `fraction-equivalent-${base}-${answer}`,
        topic: "fractions",
        label: "Equivalent fractions",
        prompt: `Which fraction is equal to ${base}?`,
        choices: [answer, distractorA, distractorB, "Cannot tell"].sort(),
        answer,
        answerType: "fraction-equivalent",
        hint: "Equivalent fractions cover the same amount of the same whole.",
        explanation: `${base} and ${answer} name the same part of the whole because the numerator and denominator changed by the same scale.`,
        parentNote:
          "Drawing two bars with the same length helps make equivalent fractions feel real.",
      };
    },
  },
  {
    topic: "fractions",
    label: "Compare fractions",
    build(seed) {
      const cases = [
        ["1/4", "1/8", "1/4", "Fourths are bigger equal parts than eighths."],
        [
          "2/3",
          "2/5",
          "2/3",
          "If the numerator is the same, fewer equal parts means larger parts.",
        ],
        ["3/6", "1/2", "They are equal", "3/6 simplifies to 1/2."],
      ] as const;
      const [left, right, answer, reason] = pick(cases, seed + 7);
      return {
        id: `fraction-compare-${left}-${right}`,
        topic: "fractions",
        label: "Compare fractions",
        prompt: `Which is larger: ${left} or ${right}?`,
        choices: [left, right, "They are equal", "Cannot tell"].sort(),
        answer,
        hint: "Think about the size of the equal parts, not just the digits.",
        explanation: reason,
        parentNote: "Ask Haim to draw bars if the comparison feels unclear.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Decimal comparison",
    build(seed) {
      const cases = [
        ["0.7", "0.56", "0.7", "0.7 is 0.70, or 70 hundredths."],
        ["0.407", "0.47", "0.47", "0.47 is 0.470, or 470 thousandths."],
        ["2.05", "2.5", "2.5", "2.5 is 2.50, which is greater than 2.05."],
      ] as const;
      const [left, right, answer, reason] = pick(cases, seed + 11);
      return {
        id: `decimal-compare-${left}-${right}`,
        topic: "decimals",
        label: "Decimal comparison",
        prompt: `Which is larger: ${left} or ${right}?`,
        choices: [left, right, "They are equal", "Cannot tell"].sort(),
        answer,
        hint: "Add zeros at the end to line up place-value columns.",
        explanation: reason,
        parentNote:
          "Ask Haim to read the decimals as tenths, hundredths, or thousandths.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Decimal addition",
    build(seed) {
      const cases = [
        ["2.35", "1.4", "3.75"],
        ["0.6", "0.27", "0.87"],
        ["4.08", "0.5", "4.58"],
        ["3.2", "1.65", "4.85"],
      ] as const;
      const [left, right, answer] = pick(cases, seed + 15);
      return {
        id: `decimal-add-${left}-${right}`,
        topic: "decimals",
        label: "Decimal addition",
        prompt: `Calculate ${left} + ${right}.`,
        choices: [answer, String(Number(answer) + 0.1), left + right, "5.00"]
          .filter((choice, position, all) => all.indexOf(choice) === position)
          .slice(0, 4)
          .sort(),
        answer,
        hint: "Line up the decimal points before adding.",
        explanation: `${left} + ${right} = ${answer}. The decimal point stays lined up with the place-value columns.`,
        parentNote:
          "If she rushes, ask her to rewrite the numbers with matching decimal places.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Powers of 10",
    build(seed) {
      const cases = [
        ["0.036", 1000, 36],
        ["4.7", 10, 47],
        ["0.52", 100, 52],
        ["6.4", 100, 0.064, "divide"],
      ] as const;
      const selected = pick(cases, seed + 13);
      const [value, factor, answer, kind] = selected;
      const sign = kind === "divide" ? "/" : "x";
      return {
        id: `decimal-power-${value}-${factor}-${sign}`,
        topic: "decimals",
        label: "Powers of 10",
        prompt: `Calculate ${value} ${sign} ${factor}.`,
        choices: [
          answer,
          Number(answer) * 10,
          Number(answer) / 10,
          Number(answer) + 10,
        ]
          .map(String)
          .sort(),
        answer: String(answer),
        hint:
          kind === "divide"
            ? "Dividing moves digits to smaller place-value columns."
            : "Multiplying moves digits to larger place-value columns.",
        explanation:
          kind === "divide"
            ? `${value} / ${factor} moves the digits two places smaller, giving ${answer}.`
            : `${value} x ${factor} moves the digits to larger place-value columns, giving ${answer}.`,
        parentNote: "Watch for the common mistake of just adding zeros.",
      };
    },
  },
  {
    topic: "percentages",
    label: "Benchmark percent",
    build(seed) {
      const cases = [
        [50, 80, 40, "50% is half."],
        [25, 80, 20, "25% is one quarter."],
        [10, 70, 7, "10% is one tenth."],
        [5, 60, 3, "5% is half of 10%."],
      ] as const;
      const [percent, whole, answer, trick] = pick(cases, seed + 17);
      return {
        id: `percent-${percent}-${whole}`,
        topic: "percentages",
        label: "Benchmark percent",
        prompt: `What is ${percent}% of ${whole}?`,
        choices: options(answer, [
          percent,
          whole - answer,
          answer + 10,
          answer * 2,
        ]),
        answer: String(answer),
        hint: trick,
        explanation: `${trick} So ${percent}% of ${whole} is ${answer}.`,
        parentNote: "Ask: percent of what whole?",
      };
    },
  },
  {
    topic: "percentages",
    label: "Discount story",
    build(seed) {
      const cases = [
        [25, 40, 30],
        [50, 36, 18],
        [10, 90, 81],
        [20, 60, 48],
      ] as const;
      const [percent, price, answer] = pick(cases, seed + 19);
      const discount = price - answer;
      return {
        id: `percent-discount-${percent}-${price}`,
        topic: "percentages",
        label: "Discount story",
        prompt: `A HK$${price} item is ${percent}% off. What is the sale price?`,
        choices: options(answer, [discount, price + discount, price - percent]),
        answer: String(answer),
        hint: "First find the discount amount, then subtract it from the original price.",
        explanation: `${percent}% of ${price} is ${discount}, so the sale price is ${price} - ${discount} = ${answer}.`,
        parentNote:
          "Check whether she answers the discount amount or the final sale price.",
      };
    },
  },
];

export function buildDailySetFromSeed(seed: number) {
  const topicOrder: Topic[] = [
    "multiplication",
    "fractions",
    "decimals",
    "percentages",
  ];
  const todayTopic = topicOrder[seed % topicOrder.length];
  const lesson = pick(topicLessons[todayTopic].recaps, seed + 23);
  const todayTemplates = templates.filter(
    (template) => template.topic === todayTopic,
  );
  const reviewTemplates = templates.filter(
    (template) => template.topic !== todayTopic,
  );
  return {
    todayTopic,
    lesson,
    questions: [
      todayTemplates[0].build(seed + 1),
      (todayTemplates[1] ?? todayTemplates[0]).build(seed + 2),
      (todayTemplates[2] ?? todayTemplates[0]).build(seed + 4),
      reviewTemplates[(seed + 3) % reviewTemplates.length].build(seed + 3),
      reviewTemplates[(seed + 5) % reviewTemplates.length].build(seed + 5),
      reviewTemplates[(seed + 7) % reviewTemplates.length].build(seed + 7),
    ].map(validateQuestion),
  };
}

function buildDailySet(refresh: number) {
  return buildDailySetFromSeed(daySeed() + refresh * 97);
}

export function DailyPractice() {
  const [refresh, setRefresh] = useState(0);
  const { todayTopic, lesson, questions } = useMemo(
    () => buildDailySet(refresh),
    [refresh],
  );
  const topicLesson = topicLessons[todayTopic];
  const [stage, setStage] = useState<Stage>("goals");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const savedSummaryRef = useRef(false);
  const current = questions[index];
  const selected = answers[current.id] ?? "";
  const isChecked = checked[current.id] ?? false;
  const isCorrect = isChecked && isAnswerCorrect(current, selected);
  const completed = questions.every((question) => checked[question.id]);
  const allQuestions = questions;
  const correctCount = allQuestions.filter(
    (question) =>
      checked[question.id] &&
      isAnswerCorrect(question, answers[question.id] ?? ""),
  ).length;
  const firstTryCorrectCount = allQuestions.filter(
    (question) =>
      checked[question.id] &&
      isAnswerCorrect(question, answers[question.id] ?? "") &&
      (attempts[question.id] ?? 1) === 1,
  ).length;
  const needsReview = Array.from(
    new Set(
      allQuestions
        .filter(
          (question) =>
            checked[question.id] &&
            !isAnswerCorrect(question, answers[question.id] ?? ""),
        )
        .map((question) => question.topic),
    ),
  );
  const suggestedReview =
    needsReview[0] ??
    sessionHistory
      .flatMap((record) => record.needsReview)
      .find((topic) => topic !== todayTopic);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(progressKey);
      if (saved) {
        setSessionHistory(JSON.parse(saved).slice(0, 10));
      }
    } catch {
      setSessionHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!(stage === "summary" || completed) || savedSummaryRef.current) return;
    savedSummaryRef.current = true;
    const record: SessionRecord = {
      date: todayKey(),
      topic: todayTopic,
      total: allQuestions.length,
      correct: correctCount,
      needsReview,
    };
    const nextHistory = [
      record,
      ...sessionHistory.filter((item) => item.date !== record.date),
    ].slice(0, 10);
    setSessionHistory(nextHistory);
    try {
      window.localStorage.setItem(progressKey, JSON.stringify(nextHistory));
    } catch {
      // Local progress is helpful, but the practice should still work without it.
    }
  }, [
    allQuestions.length,
    completed,
    correctCount,
    needsReview,
    sessionHistory,
    stage,
    todayTopic,
  ]);

  function selectAnswer(answer: string) {
    if (isChecked && isAnswerCorrect(current, selected)) return;
    setAnswers((all) => ({ ...all, [current.id]: answer }));
    if (isChecked) {
      setChecked((all) => ({ ...all, [current.id]: false }));
    }
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    setStage("gugudan");
  }

  function back() {
    if (stage === "summary") {
      setStage("gugudan");
      return;
    }
    if (stage === "gugudan") {
      setStage("practice");
      setIndex(questions.length - 1);
      return;
    }
    if (stage === "practice" && index > 0) {
      setIndex((value) => value - 1);
      return;
    }
    const stageIndex = stageOrder.indexOf(stage);
    if (stageIndex > 0) {
      setStage(stageOrder[stageIndex - 1]);
    }
  }

  function restart() {
    savedSummaryRef.current = false;
    setRefresh((value) => value + 1);
    setStage("goals");
    setIndex(0);
    setAnswers({});
    setChecked({});
    setAttempts({});
    setShowHint({});
  }

  function checkCurrent() {
    if (!selected) return;
    setAttempts((all) => ({
      ...all,
      [current.id]: (all[current.id] ?? 0) + 1,
    }));
    setChecked((all) => ({ ...all, [current.id]: true }));
    if (selected !== current.answer) {
      setShowHint((all) => ({ ...all, [current.id]: true }));
    }
  }

  function tryAgain() {
    setChecked((all) => ({ ...all, [current.id]: false }));
    setAnswers((all) => {
      const nextAnswers = { ...all };
      delete nextAnswers[current.id];
      return nextAnswers;
    });
    setShowHint((all) => ({ ...all, [current.id]: true }));
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-6 text-[#f8efe1] shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d99b4a]">
              Daily practice
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
              Learn, practise, finish with 구구단.
            </h1>
          </div>
          <div className="grid size-14 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]">
            <Sparkles className="size-7" />
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[#d8cdbb]">
          Today starts with {topicLabels[todayTopic].toLowerCase()}, then gives
          six practice questions and one 구구단 fluency finish.
        </p>
      </section>

      {stage !== "goals" ? (
        <button
          onClick={back}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-white/80 px-4 py-2 font-semibold text-[#53615c] shadow-sm"
        >
          Back
        </button>
      ) : null}

      {stage === "goals" ? (
        <section className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#dceaf0] text-[#24495a]">
              <Target className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94652e]">
                Today&apos;s learning goal
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">
                {topicLabels[todayTopic]}
              </h2>
              <p className="mt-4 text-lg leading-7 text-[#53615c]">
                {topicLesson.goal}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Learn the idea", "Try six questions", "Finish with 구구단"].map(
              (item, position) => (
                <div key={item} className="rounded-2xl bg-[#f7fbf7] p-4">
                  <p className="text-2xl font-semibold text-[#2f6173]">
                    {position + 1}
                  </p>
                  <p className="mt-1 font-semibold">{item}</p>
                </div>
              ),
            )}
          </div>
          <button
            onClick={() => setStage("lesson")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1]"
          >
            Start today&apos;s learning
            <ArrowRight className="size-4" />
          </button>
        </section>
      ) : null}

      {stage === "lesson" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-[#94652e]">Big idea</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
              {lesson.title}
            </h2>
            <p className="mt-4 text-lg leading-7 text-[#53615c]">
              {lesson.bigIdea}
            </p>
            <div className="mt-6 grid gap-3">
              {lesson.steps.map((step, position) => (
                <p
                  key={step}
                  className="flex gap-3 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#53615c]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d99b4a] text-sm font-bold text-[#10211f]">
                    {position + 1}
                  </span>
                  <span>{step}</span>
                </p>
              ))}
            </div>
          </article>
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-[#cfded7] bg-[#f7fbf7] p-6">
              <p className="flex items-center gap-2 font-semibold text-[#24495a]">
                <Lightbulb className="size-5" />
                Worked example
              </p>
              <p className="mt-4 text-lg leading-7 text-[#41504b]">
                {lesson.example}
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#dfd3c0] bg-[#fff3dd] p-6">
              <p className="font-semibold text-[#754714]">Common trap</p>
              <p className="mt-3 leading-6 text-[#754714]">{lesson.trap}</p>
            </div>
            <button
              onClick={() => setStage("practice")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1]"
            >
              Try practice questions
              <ArrowRight className="size-4" />
            </button>
          </aside>
        </section>
      ) : null}

      {stage === "practice" || stage === "gugudan" ? (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-3">
            {questions.map((question, position) => {
              const done = checked[question.id];
              const right =
                done && isAnswerCorrect(question, answers[question.id] ?? "");
              return (
                <button
                  key={question.id}
                  onClick={() => setIndex(position)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    index === position
                      ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                      : "border-[#dfd3c0] bg-white/75 text-[#17211f] hover:border-[#2f6173]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Question {position + 1}</p>
                    {done ? (
                      <span
                        className={right ? "text-[#8fb57f]" : "text-[#d99b4a]"}
                      >
                        {right ? "Correct" : "Review"}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={`mt-1 text-sm ${index === position ? "text-[#d8cdbb]" : "text-[#53615c]"}`}
                  >
                    {question.label}
                  </p>
                </button>
              );
            })}
            <button
              onClick={() => setStage("gugudan")}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                stage === "gugudan"
                  ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                  : "border-[#dfd3c0] bg-white/75 text-[#17211f] hover:border-[#2f6173]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Final step</p>
              </div>
              <p
                className={`mt-1 text-sm ${stage === "gugudan" ? "text-[#d8cdbb]" : "text-[#53615c]"}`}
              >
                구구단 finish
              </p>
            </button>
          </aside>

          {stage === "gugudan" ? (
            <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-[#94652e]">
                구구단 finish
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
                Finish with focused multiplication-table practice.
              </h2>
              <p className="mt-4 text-lg leading-7 text-[#53615c]">
                Daily Practice is done. Now open the 구구단 room and practise as
                many facts as you want, with tricks, mixed recall, hard facts,
                and reverse facts.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/gugudan"
                  className="inline-flex min-h-20 items-center justify-center rounded-2xl bg-[#10211f] px-5 py-4 text-center text-lg font-semibold text-[#f8efe1]"
                >
                  Go to 구구단 practice
                </Link>
                <button
                  onClick={() => setStage("summary")}
                  className="inline-flex min-h-20 items-center justify-center rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-5 py-4 text-center text-lg font-semibold text-[#53615c]"
                >
                  See today&apos;s summary
                </button>
              </div>
            </article>
          ) : (
            <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#94652e]">
                    {topicLabels[current.topic]}
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
                    {current.prompt}
                  </h2>
                </div>
                <span className="rounded-full bg-[#dceaf0] px-4 py-2 text-sm font-semibold text-[#24495a]">
                  {index + 1} of {questions.length}
                </span>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {current.choices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => selectAnswer(choice)}
                    disabled={isChecked}
                    className={`min-h-20 rounded-2xl border p-4 text-xl font-semibold transition ${
                      selected === choice
                        ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                        : "border-[#d8cdbb] bg-[#fffdf8] hover:border-[#2f6173]"
                    } ${
                      isChecked && isAnswerCorrect(current, choice)
                        ? "border-[#36582e] bg-[#dfe9d6] text-[#36582e]"
                        : ""
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setShowHint((all) => ({ ...all, [current.id]: true }))
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-[#fffdf8] px-4 py-2 font-semibold text-[#53615c]"
                >
                  <Lightbulb className="size-4" />
                  Hint
                </button>
                {!isChecked ? (
                  <button
                    onClick={checkCurrent}
                    disabled={!selected}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1] disabled:opacity-50"
                  >
                    Check
                  </button>
                ) : !isCorrect && (attempts[current.id] ?? 1) < 2 ? (
                  <button
                    onClick={tryAgain}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Try once more
                  </button>
                ) : index < questions.length - 1 ? (
                  <button
                    onClick={next}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Next
                    <ArrowRight className="size-4" />
                  </button>
                ) : !completed ? (
                  <button
                    onClick={next}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Go to 구구단
                    <ArrowRight className="size-4" />
                  </button>
                ) : null}
              </div>

              {showHint[current.id] ? (
                <p className="mt-5 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#754714]">
                  <span className="font-semibold">Hint: </span>
                  {current.hint}
                </p>
              ) : null}

              {isChecked ? (
                <div
                  className={`mt-5 rounded-[1.5rem] p-5 ${isCorrect ? "bg-[#edf7e8] text-[#244d32]" : "bg-[#fff3dd] text-[#754714]"}`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    {isCorrect ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <CircleAlert className="size-5" />
                    )}
                    {isCorrect
                      ? "Correct"
                      : (attempts[current.id] ?? 1) < 2
                        ? "Not quite yet. Use the hint, then try once more."
                        : `Good review moment. Answer: ${current.answer}`}
                  </p>
                  {isCorrect || (attempts[current.id] ?? 1) >= 2 ? (
                    <p className="mt-3 leading-6">{current.explanation}</p>
                  ) : null}
                  <div className="mt-4 rounded-2xl bg-white/60 p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      <BookOpenCheck className="size-4" />
                      Parent note
                    </p>
                    <p className="mt-2 leading-6">{current.parentNote}</p>
                  </div>
                </div>
              ) : null}
            </article>
          )}
        </section>
      ) : null}

      {stage === "summary" || completed ? (
        <section className="rounded-[1.5rem] border border-[#cfded7] bg-[#f7fbf7] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#94652e]">
            Finished
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            {correctCount} out of {allQuestions.length} correct
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#36582e]">
            First-try fluency: {firstTryCorrectCount} out of{" "}
            {allQuestions.length}
          </p>
          <p className="mt-3 leading-6 text-[#53615c]">
            The most useful next step is to explain one tricky question aloud,
            then stop while the session still feels light.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">Parent read</p>
              <p className="mt-2 leading-6 text-[#53615c]">
                {needsReview.length > 0
                  ? `Review ${needsReview.map((topic) => topicLabels[topic]).join(", ")} next.`
                  : "No obvious weak spot today. Keep the next session short and confident."}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">
                Suggested next focus
              </p>
              <p className="mt-2 leading-6 text-[#53615c]">
                {suggestedReview
                  ? topicLabels[suggestedReview]
                  : `${topicLabels[todayTopic]} with one harder story problem`}
              </p>
            </div>
          </div>
          {sessionHistory.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">Recent practice</p>
              <div className="mt-3 grid gap-2">
                {sessionHistory.slice(0, 3).map((record) => (
                  <p
                    key={`${record.date}-${record.topic}`}
                    className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#f7fbf7] px-3 py-2 text-sm text-[#53615c]"
                  >
                    <span>{record.date}</span>
                    <span>{topicLabels[record.topic]}</span>
                    <span>
                      {record.correct}/{record.total}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          <button
            onClick={restart}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
          >
            <RefreshCw className="size-4" />
            Start again
          </button>
        </section>
      ) : null}
    </div>
  );
}
