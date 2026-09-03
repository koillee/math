"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Divide,
  Grid3X3,
  Lightbulb,
  Percent,
  PieChart,
  Ruler,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

type ModuleId = "multiplication" | "fractions" | "decimals" | "percentages";

type WorkedExample = {
  problem: string;
  steps: string[];
  answer: string;
};

type GuidedCheck = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type LearningModule = {
  id: ModuleId;
  title: string;
  shortTitle: string;
  status: string;
  icon: typeof Divide;
  color: string;
  bigIdea: string;
  visual: {
    label: string;
    cells: string[];
    highlight: number[];
  };
  strategyTitle: string;
  strategies: string[];
  traps: string[];
  examples: WorkedExample[];
  guidedCheck: GuidedCheck;
  parentPrompt: string;
};

const modules: LearningModule[] = [
  {
    id: "multiplication",
    title: "Multiplication & Division",
    shortTitle: "Multiply & divide",
    status: "Start here",
    icon: Divide,
    color: "bg-[#dceaf0] text-[#24495a]",
    bigIdea:
      "Multiplication makes equal groups. Division undoes multiplication by splitting a total into equal groups or finding how many groups fit.",
    visual: {
      label: "4 rows of 6 makes 24",
      cells: Array.from({ length: 24 }, (_, index) => String(index + 1)),
      highlight: [5, 11, 17, 23],
    },
    strategyTitle: "Reliable method",
    strategies: [
      "Ask: are there equal groups?",
      "Write the matching fact family: 4 x 6 = 24, 6 x 4 = 24, 24 / 4 = 6, 24 / 6 = 4.",
      "For a missing number, undo the operation with the opposite operation.",
      "For word problems, check whether the answer should be a total, a group size, or a number of groups.",
    ],
    traps: [
      "Guessing division instead of using a known multiplication fact.",
      "Forgetting what the remainder means in a story.",
      "Multiplying when the problem is asking for each group.",
    ],
    examples: [
      {
        problem: "6 teams have 7 students each. How many students?",
        steps: [
          "There are equal groups.",
          "6 groups of 7 means 6 x 7.",
          "6 x 7 = 42.",
        ],
        answer: "42 students",
      },
      {
        problem:
          "48 stickers are shared equally into 6 bags. How many in each bag?",
        steps: [
          "The total is 48.",
          "There are 6 equal bags.",
          "Use the fact 6 x 8 = 48, so 48 / 6 = 8.",
        ],
        answer: "8 stickers in each bag",
      },
    ],
    guidedCheck: {
      question: "If 7 x 8 = 56, what is 56 / 7?",
      choices: ["6", "7", "8", "9"],
      answer: "8",
      explanation:
        "The division fact uses the same fact family: 7 groups of 8 make 56, so 56 split into 7 groups gives 8 in each group.",
    },
    parentPrompt:
      "Ask Haim: if you know one multiplication fact, what other facts do you get for free?",
  },
  {
    id: "fractions",
    title: "Fractions",
    shortTitle: "Fractions",
    status: "Build meaning",
    icon: PieChart,
    color: "bg-[#f4dfbd] text-[#754714]",
    bigIdea:
      "A fraction shows equal parts of a whole. The denominator names how many equal parts make the whole; the numerator counts how many parts we have.",
    visual: {
      label: "3 out of 8 equal parts",
      cells: ["1/8", "1/8", "1/8", "1/8", "1/8", "1/8", "1/8", "1/8"],
      highlight: [0, 1, 2],
    },
    strategyTitle: "Reliable method",
    strategies: [
      "First ask: what is the whole?",
      "Check the parts are equal.",
      "Use the denominator to name the size of each part.",
      "Use pictures, bars, or number lines before jumping to rules.",
    ],
    traps: [
      "Thinking a bigger denominator always means a bigger amount.",
      "Adding denominators when adding fractions.",
      "Comparing fractions without checking whether the whole is the same.",
    ],
    examples: [
      {
        problem: "Which is larger: 1/4 or 1/8?",
        steps: [
          "Both are one part of the same whole.",
          "Four equal parts are larger pieces than eight equal parts.",
          "So one fourth is larger than one eighth.",
        ],
        answer: "1/4",
      },
      {
        problem: "What is 3/4 of 20?",
        steps: [
          "The denominator 4 means split 20 into 4 equal groups.",
          "20 / 4 = 5.",
          "The numerator 3 means take 3 groups: 3 x 5 = 15.",
        ],
        answer: "15",
      },
    ],
    guidedCheck: {
      question: "What is 1/5 of 30?",
      choices: ["5", "6", "10", "25"],
      answer: "6",
      explanation: "One fifth means split 30 into 5 equal groups. 30 / 5 = 6.",
    },
    parentPrompt: "Ask Haim: what is the whole, and are the parts equal?",
  },
  {
    id: "decimals",
    title: "Decimals",
    shortTitle: "Decimals",
    status: "Place value",
    icon: Grid3X3,
    color: "bg-[#dfe9d6] text-[#36582e]",
    bigIdea:
      "Decimals are place value for parts smaller than one. Tenths, hundredths, and thousandths are columns, just like tens and hundreds.",
    visual: {
      label: "0.47 means 47 hundredths",
      cells: Array.from({ length: 10 }, (_, index) => `${index + 1}/10`),
      highlight: [0, 1, 2, 3],
    },
    strategyTitle: "Reliable method",
    strategies: [
      "Line up place-value columns before comparing.",
      "Add zeros at the end only to help compare: 0.7 = 0.70.",
      "Read decimals by place value: 0.47 is forty-seven hundredths.",
      "For x10, x100, and x1000, think digits moving through columns.",
    ],
    traps: [
      "Thinking 0.56 is bigger than 0.7 because 56 is bigger than 7.",
      "Adding zeros for x10 without thinking about place value.",
      "Ignoring zeros in the middle of decimals.",
    ],
    examples: [
      {
        problem: "Which is larger: 0.7 or 0.56?",
        steps: [
          "Write 0.7 as 0.70.",
          "Compare 70 hundredths with 56 hundredths.",
          "70 hundredths is larger.",
        ],
        answer: "0.7",
      },
      {
        problem: "Calculate 0.036 x 1000.",
        steps: [
          "x1000 means three place-value moves larger.",
          "0.036 -> 0.36 -> 3.6 -> 36.",
          "The answer is 36, not 360.",
        ],
        answer: "36",
      },
    ],
    guidedCheck: {
      question: "Which is larger: 0.4 or 0.35?",
      choices: ["0.35", "0.4", "They are equal", "Cannot tell"],
      answer: "0.4",
      explanation:
        "0.4 is 0.40, or 40 hundredths. 40 hundredths is larger than 35 hundredths.",
    },
    parentPrompt:
      "Ask Haim to read the decimal using place-value words, not just digits.",
  },
  {
    id: "percentages",
    title: "Percentages",
    shortTitle: "Percentages",
    status: "Coming soon",
    icon: Percent,
    color: "bg-[#f2d9d3] text-[#7f3526]",
    bigIdea:
      "Percent means out of 100. Percentages are another way to talk about fractions and decimals.",
    visual: {
      label: "25% means 25 out of 100",
      cells: Array.from({ length: 20 }, (_, index) => String(index + 1)),
      highlight: [0, 1, 2, 3, 4],
    },
    strategyTitle: "Reliable method",
    strategies: [
      "Always ask: percent of what whole?",
      "Use benchmark facts first: 50% is half, 25% is a quarter, 10% is one tenth.",
      "Find 5% by halving 10%.",
      "Connect percent to fractions and decimals whenever possible.",
    ],
    traps: [
      "Treating the percent number as the answer.",
      "Forgetting the whole or base in comparison problems.",
      "Confusing discount amount with final price.",
    ],
    examples: [
      {
        problem: "What is 25% of 80?",
        steps: [
          "25% means one quarter.",
          "One quarter of 80 means 80 / 4.",
          "80 / 4 = 20.",
        ],
        answer: "20",
      },
      {
        problem: "A $50 item has a 10% discount. How much is taken off?",
        steps: [
          "10% means one tenth.",
          "One tenth of 50 is 5.",
          "The discount amount is $5.",
        ],
        answer: "$5",
      },
    ],
    guidedCheck: {
      question: "What is 10% of 70?",
      choices: ["7", "10", "17", "60"],
      answer: "7",
      explanation: "10% is one tenth. One tenth of 70 is 70 / 10 = 7.",
    },
    parentPrompt:
      "Ask Haim: what is the whole that the percent is talking about?",
  },
];

function ModuleVisual({ module }: { module: LearningModule }) {
  const columns = module.id === "percentages" ? "grid-cols-10" : "grid-cols-8";
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#53615c]">
        {module.visual.label}
      </p>
      <div className={`grid ${columns} gap-1`}>
        {module.visual.cells.map((cell, index) => (
          <div
            key={`${module.id}-${cell}-${index}`}
            className={`grid aspect-square place-items-center rounded-md text-[10px] font-semibold ${
              module.visual.highlight.includes(index)
                ? "bg-[#2f6173] text-white"
                : "bg-[#ebe1d1] text-[#64716c]"
            }`}
          >
            {module.id === "fractions" ? "" : cell}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LessonModules() {
  const [activeId, setActiveId] = useState<ModuleId>("multiplication");
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const active = useMemo(
    () => modules.find((module) => module.id === activeId) ?? modules[0],
    [activeId],
  );
  const ActiveIcon = active.icon;
  const isCorrect = checked && selected === active.guidedCheck.answer;

  function chooseModule(id: ModuleId) {
    setActiveId(id);
    setSelected("");
    setChecked(false);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-6 text-[#f8efe1] shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d99b4a]">
              Teaching modules
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
              Learn the idea before practice.
            </h1>
          </div>
          <div className="grid size-14 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]">
            <BookOpenCheck className="size-7" />
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[#d8cdbb]">
          These lessons slow down the core Year 6 foundations: multiplication,
          division, fractions, decimals, and percentages. Each module teaches a
          method, shows traps, and ends with a tiny guided check.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => chooseModule(module.id)}
              className={`min-h-32 rounded-2xl border p-4 text-left transition ${
                active.id === module.id
                  ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                  : "border-[#dfd3c0] bg-white/75 text-[#17211f] hover:border-[#2f6173]"
              }`}
            >
              <div
                className={`mb-3 grid size-10 place-items-center rounded-2xl ${
                  active.id === module.id
                    ? "bg-[#d99b4a] text-[#10211f]"
                    : module.color
                }`}
              >
                <Icon className="size-5" />
              </div>
              <p className="font-semibold">{module.shortTitle}</p>
              <p
                className={`mt-2 text-sm ${
                  active.id === module.id ? "text-[#d8cdbb]" : "text-[#53615c]"
                }`}
              >
                {module.status}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div
              className={`grid size-12 shrink-0 place-items-center rounded-2xl ${active.color}`}
            >
              <ActiveIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94652e]">
                {active.status}
              </p>
              <h2 className="mt-1 font-serif text-4xl font-semibold">
                {active.title}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[#f7fbf7] p-5">
            <p className="flex items-center gap-2 font-semibold text-[#24495a]">
              <Sparkles className="size-5" />
              Big idea
            </p>
            <p className="mt-3 text-lg leading-7 text-[#41504b]">
              {active.bigIdea}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#dfd3c0] bg-[#fffdf8] p-5">
            <ModuleVisual module={active} />
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-2 text-xl font-semibold">
              <Lightbulb className="size-5 text-[#2f6173]" />
              {active.strategyTitle}
            </p>
            <div className="mt-4 grid gap-3">
              {active.strategies.map((strategy, index) => (
                <p
                  key={strategy}
                  className="flex gap-3 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#53615c]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d99b4a] text-sm font-bold text-[#10211f]">
                    {index + 1}
                  </span>
                  <span>{strategy}</span>
                </p>
              ))}
            </div>
          </div>
        </article>

        <div className="space-y-5">
          <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm">
            <p className="flex items-center gap-2 text-xl font-semibold">
              <Ruler className="size-5 text-[#2f6173]" />
              Worked examples
            </p>
            <div className="mt-4 space-y-4">
              {active.examples.map((example) => (
                <div
                  key={example.problem}
                  className="rounded-2xl border border-[#dfd3c0] bg-[#fffdf8] p-4"
                >
                  <p className="font-serif text-2xl font-semibold">
                    {example.problem}
                  </p>
                  <ol className="mt-4 space-y-2">
                    {example.steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-[#53615c]">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#dceaf0] text-xs font-bold text-[#24495a]">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 rounded-2xl bg-[#10211f] p-3 font-semibold text-[#f8efe1]">
                    Answer: {example.answer}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm">
            <p className="flex items-center gap-2 text-xl font-semibold">
              <CircleAlert className="size-5 text-[#94652e]" />
              Common traps
            </p>
            <div className="mt-4 grid gap-2">
              {active.traps.map((trap) => (
                <p
                  key={trap}
                  className="rounded-2xl bg-[#fff3dd] p-3 text-sm font-semibold leading-5 text-[#754714]"
                >
                  {trap}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[#cfded7] bg-[#f7fbf7] p-6 shadow-sm">
            <p className="text-xl font-semibold">Try with help</p>
            <p className="mt-3 font-serif text-3xl font-semibold">
              {active.guidedCheck.question}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {active.guidedCheck.choices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => {
                    if (!checked) setSelected(choice);
                  }}
                  disabled={checked}
                  className={`rounded-2xl border p-4 text-xl font-semibold transition ${
                    selected === choice
                      ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                      : "border-[#d8cdbb] bg-white/80 hover:border-[#2f6173]"
                  } ${
                    checked && choice === active.guidedCheck.answer
                      ? "border-[#36582e] bg-[#dfe9d6] text-[#36582e]"
                      : ""
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
            {!checked ? (
              <button
                onClick={() => selected && setChecked(true)}
                disabled={!selected}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1] disabled:opacity-50"
              >
                Check
              </button>
            ) : (
              <div
                className={`mt-5 rounded-2xl p-4 ${
                  isCorrect
                    ? "bg-[#edf7e8] text-[#244d32]"
                    : "bg-[#fff3dd] text-[#754714]"
                }`}
              >
                <p className="flex items-center gap-2 font-semibold">
                  {isCorrect ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <CircleAlert className="size-5" />
                  )}
                  {isCorrect ? "Correct" : "Not quite yet"}
                </p>
                <p className="mt-2 leading-6">
                  {active.guidedCheck.explanation}
                </p>
                <button
                  onClick={() => {
                    setSelected("");
                    setChecked(false);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-4 py-2 text-sm font-semibold text-[#f8efe1]"
                >
                  Try again
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </article>

          <article className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5">
            <p className="font-semibold">Parent prompt</p>
            <p className="mt-2 leading-6 text-[#53615c]">
              {active.parentPrompt}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
