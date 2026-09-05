"use client";

import {
  ArrowRight,
  CheckCircle2,
  Divide,
  Grid3X3,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FactStatus = "new" | "learning" | "strong" | "mastered";
type Mode = "learn" | "focus" | "mixed" | "reverse" | "hard";
type FactProgress = {
  correct: number;
  attempts: number;
  streak: number;
  lastPracticedAt?: string;
};
type Prompt = {
  id: string;
  a: number;
  b: number;
  answer: number;
  question: string;
  helper: string;
  mode: Mode;
};

const FACTS = Array.from({ length: 9 }, (_, a) =>
  Array.from({ length: 9 }, (_, b) => ({ a: a + 1, b: b + 1 })),
).flat();

const EASY_FACTORS = new Set([1, 2, 5, 10]);
const HARD_FACT_IDS = new Set(["6x6", "6x7", "6x8", "7x7", "7x8", "8x8"]);
const STORAGE_KEY = "haim-gugudan-progress-v1";

const modes: { id: Mode; label: string; description: string }[] = [
  {
    id: "learn",
    label: "Learn tricks",
    description: "See the table shrink, then learn one useful pattern.",
  },
  {
    id: "focus",
    label: "Focus round",
    description: "Practise one table with helpful strategy prompts.",
  },
  {
    id: "mixed",
    label: "Mixed recall",
    description: "Mix learned facts so recall becomes automatic.",
  },
  {
    id: "reverse",
    label: "Reverse facts",
    description: "Connect multiplication to division and missing numbers.",
  },
  {
    id: "hard",
    label: "Hard facts",
    description:
      "Conquer the small group of facts that usually need extra practice.",
  },
];

function factId(a: number, b: number) {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return `${low}x${high}`;
}

function statusFor(progress?: FactProgress): FactStatus {
  if (!progress || progress.attempts === 0) return "new";
  const accuracy = progress.correct / progress.attempts;
  if (progress.streak >= 5 && accuracy >= 0.9) return "mastered";
  if (progress.streak >= 3 && accuracy >= 0.75) return "strong";
  return "learning";
}

function trickFor(a: number, b: number) {
  const n = Math.max(a, b);
  const other = Math.min(a, b);
  if (a === 1 || b === 1) return "x1 keeps the other number the same.";
  if (a === 2 || b === 2) return `x2 means double ${n}.`;
  if (a === 5 || b === 5)
    return `x5 is half of x10: ${n} x 10 is ${n * 10}, half is ${n * 5}.`;
  if (a === 10 || b === 10)
    return "x10 appends one place-value zero for whole numbers.";
  if (a === 4 || b === 4)
    return `x4 means double twice: double ${n}, then double again.`;
  if (a === 8 || b === 8)
    return `x8 means double three times: ${other} -> ${other * 2} -> ${other * 4} -> ${other * 8}.`;
  if (a === 9 || b === 9)
    return `x9 is x10 minus one group: ${n * 10} - ${n} = ${n * 9}.`;
  if (a === 6 || b === 6)
    return `x6 is x5 plus one more group: ${n * 5} + ${n} = ${n * 6}.`;
  if (a === 7 || b === 7)
    return "Use a nearby fact you know, then adjust carefully.";
  return "Use mirror facts and nearby facts to reduce memory work.";
}

export function makeOptions(answer: number, a: number, b: number) {
  const candidates = [
    answer,
    answer + a,
    answer - a,
    answer + b,
    answer - b,
    a + b,
    answer + 10,
    answer - 10,
  ].filter((value) => value > 0 && value <= 100);
  const unique = Array.from(new Set(candidates));
  for (let n = 2; unique.length < 4 && n <= 9; n += 1) {
    const option = n * Math.max(a, b);
    if (!unique.includes(option)) unique.push(option);
  }
  for (let offset = 1; unique.length < 4 && offset <= 20; offset += 1) {
    const lower = answer - offset;
    const higher = answer + offset;
    if (lower > 0 && !unique.includes(lower)) unique.push(lower);
    if (higher <= 100 && !unique.includes(higher)) unique.push(higher);
  }
  return unique
    .slice(0, 4)
    .sort(
      (left, right) =>
        ((left * 17 + answer) % 11) - ((right * 17 + answer) % 11),
    );
}

export function validatePrompt(prompt: Prompt) {
  const expected =
    prompt.mode === "reverse"
      ? prompt.question.includes("÷")
        ? prompt.a
        : prompt.b
      : prompt.a * prompt.b;
  const choices = makeOptions(prompt.answer, prompt.a, prompt.b);
  if (
    prompt.answer !== expected ||
    !choices.includes(prompt.answer) ||
    new Set(choices).size !== 4
  ) {
    throw new Error(`Invalid 구구단 prompt: ${prompt.id}`);
  }
  return prompt;
}

export function buildPrompt(
  mode: Mode,
  focus: number,
  progress: Record<string, FactProgress>,
  step: number,
): Prompt {
  const scored = FACTS.map((fact) => {
    const id = factId(fact.a, fact.b);
    const current = progress[id];
    const status = statusFor(current);
    const hardBonus = HARD_FACT_IDS.has(id) ? 4 : 0;
    const weakBonus =
      status === "new"
        ? 5
        : status === "learning"
          ? 7
          : status === "strong"
            ? 2
            : 0;
    const focusBonus = fact.a === focus || fact.b === focus ? 8 : 0;
    const easyPenalty =
      EASY_FACTORS.has(fact.a) || EASY_FACTORS.has(fact.b) ? -2 : 0;
    return {
      ...fact,
      id,
      score: weakBonus + focusBonus + hardBonus + easyPenalty,
    };
  });

  const pool = scored
    .filter((fact) => {
      if (mode === "focus") return fact.a === focus || fact.b === focus;
      if (mode === "hard") return HARD_FACT_IDS.has(fact.id);
      if (mode === "mixed" || mode === "reverse") return true;
      return (
        fact.a === focus ||
        fact.b === focus ||
        EASY_FACTORS.has(fact.a) ||
        EASY_FACTORS.has(fact.b)
      );
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        ((left.a * 9 + left.b + step) % 13) -
          ((right.a * 9 + right.b + step) % 13),
    );

  const selected =
    pool[step % Math.max(1, Math.min(pool.length, 12))] ?? scored[0];
  const answer = selected.a * selected.b;
  if (mode === "reverse") {
    const hideFirst = step % 2 === 0;
    return {
      id: `${selected.id}-reverse-${step}`,
      a: selected.a,
      b: selected.b,
      answer: hideFirst ? selected.a : selected.b,
      question: hideFirst
        ? `${answer} ÷ ${selected.b} = ?`
        : `${selected.a} x ? = ${answer}`,
      helper: `Use the full fact: ${selected.a} x ${selected.b} = ${answer}.`,
      mode,
    };
  }
  return {
    id: `${selected.id}-${mode}-${step}`,
    a: selected.a,
    b: selected.b,
    answer,
    question: `${selected.a} x ${selected.b} = ?`,
    helper: trickFor(selected.a, selected.b),
    mode,
  };
}

function loadProgress() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, FactProgress>)
      : {};
  } catch {
    return {};
  }
}

export function GugudanPractice() {
  const [mode, setMode] = useState<Mode>("learn");
  const [focus, setFocus] = useState(7);
  const [progress, setProgress] = useState<Record<string, FactProgress>>({});
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => setProgress(loadProgress()), []);
  useEffect(() => {
    if (typeof window !== "undefined")
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const prompt = useMemo(
    () => validatePrompt(buildPrompt(mode, focus, progress, step)),
    [mode, focus, progress, step],
  );
  const options = useMemo(
    () => makeOptions(prompt.answer, prompt.a, prompt.b),
    [prompt],
  );
  const correct = checked && selected === prompt.answer;
  const masteredCount = FACTS.filter(
    (fact) => statusFor(progress[factId(fact.a, fact.b)]) === "mastered",
  ).length;
  const strongCount = FACTS.filter((fact) =>
    ["strong", "mastered"].includes(
      statusFor(progress[factId(fact.a, fact.b)]),
    ),
  ).length;

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setStep(0);
    setSelected(null);
    setChecked(false);
  }

  function check() {
    if (selected === null) return;
    const id = factId(prompt.a, prompt.b);
    const wasCorrect = selected === prompt.answer;
    setProgress((all) => {
      const current = all[id] ?? { correct: 0, attempts: 0, streak: 0 };
      return {
        ...all,
        [id]: {
          correct: current.correct + (wasCorrect ? 1 : 0),
          attempts: current.attempts + 1,
          streak: wasCorrect ? current.streak + 1 : 0,
          lastPracticedAt: new Date().toISOString(),
        },
      };
    });
    setChecked(true);
  }

  function next() {
    setSelected(null);
    setChecked(false);
    setStep((value) => value + 1);
  }

  function resetRound() {
    setSelected(null);
    setChecked(false);
    setStep(0);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-6 text-[#f8efe1] shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d99b4a]">
              Gugudan mastery
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
              Learn the trick, then recall fast.
            </h1>
          </div>
          <div className="grid size-14 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]">
            <Sparkles className="size-7" />
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[#d8cdbb]">
          This practice shrinks the table with mirror facts, teaches useful
          patterns, then repeats the facts that still need attention.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-3xl font-semibold text-[#d99b4a]">
              {masteredCount}
            </p>
            <p className="text-sm text-[#d8cdbb]">facts mastered</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-3xl font-semibold text-[#d99b4a]">
              {strongCount}
            </p>
            <p className="text-sm text-[#d8cdbb]">strong or mastered</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-3xl font-semibold text-[#d99b4a]">
              {81 - masteredCount}
            </p>
            <p className="text-sm text-[#d8cdbb]">left to conquer</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {modes.map((item) => (
          <button
            key={item.id}
            onClick={() => chooseMode(item.id)}
            className={`min-h-28 rounded-2xl border p-4 text-left transition ${
              mode === item.id
                ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                : "border-[#dfd3c0] bg-white/75 text-[#17211f] hover:border-[#2f6173]"
            }`}
          >
            <p className="font-semibold">{item.label}</p>
            <p
              className={`mt-2 text-sm leading-5 ${mode === item.id ? "text-[#d8cdbb]" : "text-[#53615c]"}`}
            >
              {item.description}
            </p>
          </button>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
          {mode === "learn" ? (
            <div>
              <div className="flex items-center gap-2 text-[#2f6173]">
                <Lightbulb className="size-5" />
                <p className="font-semibold">Benjamin-inspired shortcut</p>
              </div>
              <h2 className="mt-3 font-serif text-3xl font-semibold">
                You do not memorize 81 facts one by one.
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  "Mirror facts cut the work: 4 x 7 and 7 x 4 have the same answer.",
                  "Easy anchors come first: x1, x2, x5, and x10.",
                  "Patterns help the harder facts: x9 is x10 minus one group.",
                  "The last hard core is small: 6x6, 6x7, 6x8, 7x7, 7x8, and 8x8.",
                ].map((line) => (
                  <p
                    key={line}
                    className="rounded-2xl bg-[#f7fbf7] p-4 leading-6 text-[#41504b]"
                  >
                    {line}
                  </p>
                ))}
              </div>
              <button
                onClick={() => chooseMode("focus")}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1]"
              >
                Start a focus round
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#94652e]">
                    Question {step + 1}
                  </p>
                  <h2 className="mt-2 font-serif text-5xl font-semibold">
                    {prompt.question}
                  </h2>
                </div>
                <button
                  onClick={resetRound}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#53615c]"
                >
                  <TimerReset className="size-4" />
                  Restart
                </button>
              </div>
              <p className="mt-5 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#754714]">
                <span className="font-semibold">Helpful trick: </span>
                {prompt.helper}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => !checked && setSelected(option)}
                    disabled={checked}
                    className={`min-h-20 rounded-2xl border p-4 text-2xl font-semibold transition ${
                      selected === option
                        ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                        : "border-[#d8cdbb] bg-[#fffdf8] hover:border-[#2f6173]"
                    } ${checked && option === prompt.answer ? "border-[#36582e] bg-[#dfe9d6] text-[#36582e]" : ""}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {!checked ? (
                <button
                  onClick={check}
                  disabled={selected === null}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1] disabled:opacity-50"
                >
                  Check
                </button>
              ) : (
                <div
                  className={`mt-6 rounded-[1.5rem] p-5 ${correct ? "bg-[#edf7e8] text-[#244d32]" : "bg-[#fff3dd] text-[#754714]"}`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    {correct ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <RotateCcw className="size-5" />
                    )}
                    {correct
                      ? "Correct. Build that recall path."
                      : `Not quite. The answer is ${prompt.answer}.`}
                  </p>
                  <p className="mt-2 leading-6">
                    {trickFor(prompt.a, prompt.b)}
                  </p>
                  <button
                    onClick={next}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Next fact
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-[#2f6173]" />
              <h2 className="text-xl font-semibold">Focus table</h2>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setFocus(n);
                    resetRound();
                  }}
                  className={`rounded-2xl px-4 py-3 font-semibold ${
                    focus === n
                      ? "bg-[#10211f] text-[#f8efe1]"
                      : "bg-[#fffdf8] text-[#17211f]"
                  }`}
                >
                  x{n}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Grid3X3 className="size-5 text-[#2f6173]" />
              <h2 className="text-xl font-semibold">Mastery grid</h2>
            </div>
            <div className="mt-4 grid grid-cols-9 gap-1">
              {FACTS.map((fact) => {
                const status = statusFor(progress[factId(fact.a, fact.b)]);
                const label = `${fact.a}x${fact.b}`;
                return (
                  <div
                    key={label}
                    title={label}
                    className={`grid aspect-square place-items-center rounded-md text-[10px] font-semibold ${
                      status === "mastered"
                        ? "bg-[#244d32] text-white"
                        : status === "strong"
                          ? "bg-[#8fb57f] text-[#10211f]"
                          : status === "learning"
                            ? "bg-[#f4dfbd] text-[#754714]"
                            : "bg-[#ebe1d1] text-[#64716c]"
                    }`}
                  >
                    {fact.a * fact.b}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#53615c]">
              <p>Green: mastered</p>
              <p>Light green: strong</p>
              <p>Gold: learning</p>
              <p>Grey: new</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#cfded7] bg-[#f7fbf7] p-5">
            <div className="flex items-center gap-2">
              <Divide className="size-5 text-[#2f6173]" />
              <h2 className="text-xl font-semibold">Why reverse facts?</h2>
            </div>
            <p className="mt-3 leading-6 text-[#53615c]">
              When Haim knows 7 x 8 = 56, division becomes less mysterious: 56
              divided by 7 must be 8. This supports fractions, ratios, and word
              problems later.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
