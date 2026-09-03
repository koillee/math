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
import { useMemo, useState } from "react";

type Topic = "multiplication" | "fractions" | "decimals" | "percentages";
type Stage = "goals" | "lesson" | "practice" | "gugudan" | "summary";
type Question = {
  id: string;
  topic: Topic | "gugudan";
  label: string;
  prompt: string;
  choices: string[];
  answer: string;
  hint: string;
  explanation: string;
  parentNote: string;
};

type Template = {
  topic: Topic;
  label: string;
  build: (seed: number) => Question;
};

const topicLabels: Record<Question["topic"], string> = {
  gugudan: "구구단 finish",
  multiplication: "Multiplication & division",
  fractions: "Fractions",
  decimals: "Decimals",
  percentages: "Percentages",
};

const topicLessons: Record<
  Topic,
  {
    goal: string;
    bigIdea: string;
    steps: string[];
    example: string;
    trap: string;
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
  },
};

function daySeed() {
  const now = new Date();
  return Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
  );
}

function pick<T>(items: readonly T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function options(answer: number, distractors: number[]) {
  return Array.from(new Set([answer, ...distractors]))
    .slice(0, 4)
    .map(String)
    .sort(
      (left, right) =>
        ((Number(left) * 13 + answer) % 7) -
        ((Number(right) * 13 + answer) % 7),
    );
}

function gugudanQuestion(seed: number): Question {
  const hardFacts = [
    [6, 6],
    [6, 7],
    [6, 8],
    [7, 7],
    [7, 8],
    [8, 8],
    [9, 6],
    [9, 7],
  ];
  const [a, b] = pick(hardFacts, seed);
  const answer = a * b;
  return {
    id: `gugudan-${a}-${b}`,
    topic: "gugudan",
    label: "Warm-up fact",
    prompt: `${a} x ${b} = ?`,
    choices: options(answer, [answer - a, answer + a, answer - b, answer + b]),
    answer: String(answer),
    hint:
      b === 9 || a === 9
        ? "Use x10, then subtract one group."
        : "Use a nearby fact or double pattern.",
    explanation: `${a} x ${b} = ${answer}. This fact supports division and fraction work later.`,
    parentNote:
      "Fast recall helps Haim spend more thinking power on the actual problem.",
  };
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
];

function buildDailySet() {
  const seed = daySeed();
  const topicOrder: Topic[] = [
    "multiplication",
    "fractions",
    "decimals",
    "percentages",
  ];
  const todayTopic = topicOrder[seed % topicOrder.length];
  const todayTemplates = templates.filter(
    (template) => template.topic === todayTopic,
  );
  const reviewTemplates = templates.filter(
    (template) => template.topic !== todayTopic,
  );
  return {
    todayTopic,
    gugudan: gugudanQuestion(seed),
    questions: [
      todayTemplates[0].build(seed + 1),
      (todayTemplates[1] ?? todayTemplates[0]).build(seed + 2),
      reviewTemplates[(seed + 3) % reviewTemplates.length].build(seed + 3),
      reviewTemplates[(seed + 5) % reviewTemplates.length].build(seed + 5),
    ],
  };
}

export function DailyPractice() {
  const { todayTopic, questions, gugudan } = useMemo(buildDailySet, []);
  const lesson = topicLessons[todayTopic];
  const [stage, setStage] = useState<Stage>("goals");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const current = stage === "gugudan" ? gugudan : questions[index];
  const selected = answers[current.id] ?? "";
  const isChecked = checked[current.id] ?? false;
  const isCorrect = isChecked && selected === current.answer;
  const completed =
    questions.every((question) => checked[question.id]) && checked[gugudan.id];
  const allQuestions = [...questions, gugudan];
  const correctCount = allQuestions.filter(
    (question) =>
      checked[question.id] && answers[question.id] === question.answer,
  ).length;

  function selectAnswer(answer: string) {
    if (isChecked) return;
    setAnswers((all) => ({ ...all, [current.id]: answer }));
  }

  function next() {
    if (stage === "gugudan") {
      setStage("summary");
      return;
    }
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    setStage("gugudan");
  }

  function restart() {
    setStage("goals");
    setIndex(0);
    setAnswers({});
    setChecked({});
    setShowHint({});
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
          four practice questions and one 구구단 fluency finish.
        </p>
      </section>

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
                {lesson.goal}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Learn the idea", "Try four questions", "Finish with 구구단"].map(
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
              {lesson.bigIdea}
            </h2>
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
              const right = done && answers[question.id] === question.answer;
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
                {checked[gugudan.id] ? (
                  <span
                    className={
                      answers[gugudan.id] === gugudan.answer
                        ? "text-[#8fb57f]"
                        : "text-[#d99b4a]"
                    }
                  >
                    {answers[gugudan.id] === gugudan.answer
                      ? "Correct"
                      : "Review"}
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-1 text-sm ${stage === "gugudan" ? "text-[#d8cdbb]" : "text-[#53615c]"}`}
              >
                구구단 finish
              </p>
            </button>
          </aside>

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
                {stage === "gugudan"
                  ? "Final step"
                  : `${index + 1} of ${questions.length}`}
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
                    isChecked && choice === current.answer
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
                  onClick={() =>
                    selected &&
                    setChecked((all) => ({ ...all, [current.id]: true }))
                  }
                  disabled={!selected}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1] disabled:opacity-50"
                >
                  Check
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
                  {stage === "gugudan" ? "Finish" : "Go to 구구단"}
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
                    : `Not quite. Answer: ${current.answer}`}
                </p>
                <p className="mt-3 leading-6">{current.explanation}</p>
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
          <p className="mt-3 leading-6 text-[#53615c]">
            The most useful next step is to explain one tricky question aloud,
            then stop while the session still feels light.
          </p>
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
