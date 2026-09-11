"use client";

import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
  LEGACY_DAILY_PROGRESS_KEY,
  type PracticeSkillId,
  type PracticeTopic,
  skillDefinitions,
  summarizeSkills,
  topicLabels,
} from "@/lib/learning/practice-progress";
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
import { useEffect, useMemo, useState } from "react";

type ModuleId = PracticeTopic;

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

type SkillLesson = {
  steps: string[];
  example: string;
  visual: string;
};

const skillLessonDetails: Record<PracticeSkillId, SkillLesson> = {
  "fact-families": {
    steps: [
      "Write the multiplication fact first.",
      "Turn it around to see the same total.",
      "Divide the total by one factor to find the other factor.",
    ],
    example: "6 x 7 = 42, so 42 / 6 = 7 and 42 / 7 = 6.",
    visual: "Picture 42 dots arranged as 6 rows of 7.",
  },
  "equal-groups": {
    steps: [
      "Find the number of groups.",
      "Find the size of one group.",
      "Multiply to find the total.",
    ],
    example: "5 craft boxes with 8 beads each means 5 x 8 = 40 beads.",
    visual: "Picture matching boxes, each holding the same number.",
  },
  "missing-factors": {
    steps: [
      "Read the total.",
      "Divide by the factor you know.",
      "Multiply back to prove the missing factor works.",
    ],
    example: "9 x ? = 72 becomes 72 / 9 = 8.",
    visual: "Picture one empty slot in a multiplication sentence.",
  },
  "division-meaning": {
    steps: [
      "Name the total.",
      "Decide whether you know the group count or group size.",
      "Use multiplication to check the division answer.",
    ],
    example: "48 stickers in 6 equal bags means 48 / 6 = 8 in each bag.",
    visual: "Picture sharing a total into equal containers.",
  },
  arrays: {
    steps: ["Count rows.", "Count columns.", "Multiply rows by columns."],
    example: "4 rows of 9 seats means 4 x 9 = 36 seats.",
    visual: "Picture a neat rectangle of rows and columns.",
  },
  "fraction-of-amount": {
    steps: [
      "Start with the whole amount.",
      "Divide by the denominator.",
      "Multiply by the numerator.",
    ],
    example: "3/4 of 20 is 20 / 4 = 5, then 5 x 3 = 15.",
    visual: "Picture the amount split into equal groups.",
  },
  "equivalent-fractions": {
    steps: [
      "Keep the whole the same size.",
      "Multiply the top and bottom by the same number.",
      "Check that the shaded amount did not change.",
    ],
    example: "1/2 = 2/4 = 3/6.",
    visual: "Picture the same bar cut into more equal pieces.",
  },
  "simplifying-fractions": {
    steps: [
      "Find a number that divides the numerator and denominator.",
      "Divide both parts by that number.",
      "Stop when no common factor is left.",
    ],
    example: "6/8 simplifies to 3/4 because both parts divide by 2.",
    visual: "Picture combining smaller equal pieces into bigger pieces.",
  },
  "fraction-number-line": {
    steps: [
      "Draw 0 and 1.",
      "Split the line into denominator-sized equal jumps.",
      "Count numerator jumps from 0.",
    ],
    example: "3/5 sits on the third jump when the line has 5 equal parts.",
    visual: "Picture stepping stones between 0 and 1.",
  },
  "comparing-fractions": {
    steps: [
      "Look for same denominators first.",
      "Use half as a benchmark.",
      "Draw bars if the sizes are close.",
    ],
    example: "5/8 is more than half, but 3/8 is less than half.",
    visual: "Picture two same-length bars shaded by different amounts.",
  },
  "decimal-comparison": {
    steps: [
      "Line up the decimal points.",
      "Add trailing zeros only to compare.",
      "Compare from left to right by place value.",
    ],
    example: "0.7 = 0.70, so 0.70 is bigger than 0.56.",
    visual: "Picture tenths and hundredths columns.",
  },
  "decimal-operations": {
    steps: [
      "Stack numbers with decimal points aligned.",
      "Add or subtract column by column.",
      "Bring the decimal point straight down.",
    ],
    example: "3.45 + 1.2 is 3.45 + 1.20 = 4.65.",
    visual: "Picture money columns lined up neatly.",
  },
  "decimal-place-value": {
    steps: [
      "Read the whole number part.",
      "Name tenths, hundredths, or thousandths.",
      "Use place-value words before calculating.",
    ],
    example: "0.36 means 36 hundredths.",
    visual: "Picture columns on both sides of the decimal point.",
  },
  "powers-of-10": {
    steps: [
      "Decide if the number is becoming larger or smaller.",
      "Move digits through place-value columns.",
      "Check the number of moves: 10 is one, 100 is two, 1000 is three.",
    ],
    example: "0.48 x 100 = 48.",
    visual: "Picture digits sliding through place-value rooms.",
  },
  "benchmark-percent": {
    steps: [
      "Name the whole.",
      "Use 50%, 25%, 10%, or 5% as an anchor.",
      "Combine anchors when needed.",
    ],
    example: "30% of 80 is 10% + 10% + 10%, so 8 + 8 + 8 = 24.",
    visual: "Picture a 100-square grid grouped into friendly chunks.",
  },
  "percent-conversion": {
    steps: [
      "Write the percent over 100.",
      "Simplify the fraction if possible.",
      "Move between fraction, decimal, and percent forms.",
    ],
    example: "40% = 40/100 = 2/5 = 0.4.",
    visual: "Picture 40 shaded squares out of 100.",
  },
  discounts: {
    steps: [
      "Find the discount amount.",
      "Check whether the question asks for amount off or final price.",
      "Subtract the discount from the original price if needed.",
    ],
    example: "20% off HK$150 is HK$30 off, so the sale price is HK$120.",
    visual: "Picture a price tag with one part crossed out.",
  },
  "find-the-whole": {
    steps: [
      "Name the percent part you know.",
      "Convert the percent into a friendly fraction.",
      "Rebuild the whole by making all the equal parts.",
    ],
    example: "15 is 25% of a number. 25% is 1/4, so the whole is 60.",
    visual: "Picture one known piece, then rebuild all four pieces.",
  },
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
    status: "Build benchmarks",
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

const skillEntries = Object.entries(skillDefinitions) as [
  PracticeSkillId,
  (typeof skillDefinitions)[PracticeSkillId],
][];

function loadHistory() {
  try {
    const saved = window.localStorage.getItem(DAILY_PROGRESS_KEY);
    if (saved) return JSON.parse(saved).slice(0, 20) as DailyPracticeRecord[];
    const legacy = window.localStorage.getItem(LEGACY_DAILY_PROGRESS_KEY);
    if (!legacy) return [];
    return (JSON.parse(legacy) as Partial<DailyPracticeRecord>[])
      .filter((record) => record.date && record.topic)
      .map((record, index) => ({
        id: `legacy-${record.date}-${index}`,
        date: String(record.date),
        completedAt: String(record.completedAt ?? record.date),
        topic: record.topic as DailyPracticeRecord["topic"],
        lessonTitle: "Earlier daily practice",
        total: Number(record.total ?? 0),
        correct: Number(record.correct ?? 0),
        firstTryCorrect: Number(record.firstTryCorrect ?? record.correct ?? 0),
        needsReview: (record.needsReview ??
          []) as DailyPracticeRecord["needsReview"],
        items: record.items ?? [],
      }));
  } catch {
    return [];
  }
}

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
  const [activeSkillId, setActiveSkillId] =
    useState<PracticeSkillId>("fact-families");
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [records, setRecords] = useState<DailyPracticeRecord[]>([]);
  const active = useMemo(
    () => modules.find((module) => module.id === activeId) ?? modules[0],
    [activeId],
  );
  const activeSkills = useMemo(
    () =>
      skillEntries.filter(([, definition]) => definition.topic === activeId),
    [activeId],
  );
  const skillSummaries = useMemo(() => summarizeSkills(records), [records]);
  const activeSkill =
    activeSkills.find(([skillId]) => skillId === activeSkillId) ??
    activeSkills[0];
  const activeSkillSummary = skillSummaries.find(
    (summary) => summary.skillId === activeSkill?.[0],
  );
  const activeSkillLesson = activeSkill
    ? skillLessonDetails[activeSkill[0]]
    : null;
  const ActiveIcon = active.icon;
  const isCorrect = checked && selected === active.guidedCheck.answer;

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  function chooseModule(id: ModuleId) {
    setActiveId(id);
    const nextSkill = skillEntries.find(
      ([, definition]) => definition.topic === id,
    );
    if (nextSkill) setActiveSkillId(nextSkill[0]);
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

      {activeSkill && activeSkillLesson ? (
        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#94652e]">
              {topicLabels[activeId]} skills
            </p>
            <div className="mt-4 grid gap-2">
              {activeSkills.map(([skillId, definition]) => {
                const summary = skillSummaries.find(
                  (item) => item.skillId === skillId,
                );
                return (
                  <button
                    key={skillId}
                    onClick={() => setActiveSkillId(skillId)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      activeSkill[0] === skillId
                        ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                        : "border-[#dfd3c0] bg-[#fffdf8] text-[#17211f] hover:border-[#2f6173]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{definition.name}</p>
                      {summary ? (
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            activeSkill[0] === skillId
                              ? "bg-[#d99b4a] text-[#10211f]"
                              : "bg-[#dceaf0] text-[#24495a]"
                          }`}
                        >
                          {summary.firstTryCorrect}/{summary.practised}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={`mt-2 text-sm leading-5 ${
                        activeSkill[0] === skillId
                          ? "text-[#d8cdbb]"
                          : "text-[#53615c]"
                      }`}
                    >
                      {definition.learnFocus}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-[#94652e]">Focus lesson</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
              {activeSkill[1].name}
            </h2>
            <p className="mt-4 text-lg leading-7 text-[#53615c]">
              {activeSkill[1].learnFocus}
            </p>

            <div className="mt-6 rounded-2xl bg-[#f7fbf7] p-5">
              <p className="font-semibold text-[#24495a]">Picture it</p>
              <p className="mt-2 leading-6 text-[#41504b]">
                {activeSkillLesson.visual}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {activeSkillLesson.steps.map((step, index) => (
                <p
                  key={step}
                  className="flex gap-3 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#53615c]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d99b4a] text-sm font-bold text-[#10211f]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </p>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#cfded7] bg-[#f7fbf7] p-4">
                <p className="font-semibold text-[#24495a]">Worked example</p>
                <p className="mt-2 leading-6 text-[#41504b]">
                  {activeSkillLesson.example}
                </p>
              </div>
              <div className="rounded-2xl border border-[#dfd3c0] bg-[#fff3dd] p-4">
                <p className="font-semibold text-[#754714]">Parent move</p>
                <p className="mt-2 leading-6 text-[#754714]">
                  {activeSkill[1].parentMove}
                </p>
              </div>
            </div>

            {activeSkillSummary ? (
              <div className="mt-5 rounded-2xl bg-[#10211f] p-4 text-[#f8efe1]">
                <p className="font-semibold">Recent signal</p>
                <p className="mt-2 leading-6 text-[#d8cdbb]">
                  Practised {activeSkillSummary.practised}, missed{" "}
                  {activeSkillSummary.missed}, confidence flags{" "}
                  {activeSkillSummary.confidenceFlags}.
                </p>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

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
