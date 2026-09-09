"use client";

import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
  type PracticeFeedback,
  type PracticeItemRecord,
  feedbackLabels,
  isConfidenceFlag,
  skillIdForLabel,
  skillNameForLabel,
  topicLabels,
} from "@/lib/learning/practice-progress";
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
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import {
  type Difficulty,
  type Question,
  type Topic,
  estimateQuestionDifficulty,
  extractFirstDecimal,
  extractFirstFraction,
  extractPercent,
  isAnswerCorrect,
  topicLessons,
  topicTeachingDefaults,
} from "@/lib/learning/daily-bank";
import {
  buildDailyPlan,
  loadPracticeHistory,
  practiceDate,
  resolveDailyPlan,
} from "@/lib/learning/daily-plan";
export {
  buildDailySetFromSeed,
  estimateQuestionDifficulty,
  inferredPracticeLabels,
  isAnswerCorrect,
} from "@/lib/learning/daily-bank";

type Stage = "goals" | "lesson" | "practice" | "gugudan" | "summary";

const stageOrder: Stage[] = ["goals", "lesson", "practice", "gugudan"];
const feedbackChoices: PracticeFeedback[] = [
  "understand",
  "guessed",
  "confusing",
  "too-hard",
];

function difficultyClassName(difficulty: Difficulty) {
  if (difficulty === "Warm-up") return "bg-[#e7f0dd] text-[#36582e]";
  if (difficulty === "Core") return "bg-[#dceaf0] text-[#24495a]";
  return "bg-[#fff3dd] text-[#754714]";
}

function numbersFromId(id: string) {
  return (id.match(/\d+/g) ?? []).map(Number);
}

function VisualShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#cfded7] bg-[#f7fbf7]">
      <div className="border-b border-[#d9e7df] bg-white/70 px-4 py-2 text-sm font-semibold text-[#24495a]">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DotArray({
  rows,
  columns,
  label,
}: {
  rows: number;
  columns: number;
  label: string;
}) {
  const shownRows = Math.min(rows, 12);
  const shownColumns = Math.min(columns, 12);
  const dotClass =
    shownRows * shownColumns > 80
      ? "size-2.5 rounded-full bg-[#2f6173] shadow-sm"
      : "size-3.5 rounded-full bg-[#2f6173] shadow-sm sm:size-4";
  const dots = Array.from(
    { length: shownRows * shownColumns },
    (_, position) => ({
      id: `dot-r${Math.floor(position / shownColumns)}-c${position % shownColumns}`,
    }),
  );
  return (
    <div className="space-y-3">
      <div
        className="grid w-fit gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${shownColumns}, minmax(0, 1fr))`,
        }}
      >
        {dots.map((dot) => (
          <span key={dot.id} className={dotClass} />
        ))}
      </div>
      <p className="text-sm font-semibold text-[#41504b]">{label}</p>
    </div>
  );
}

function FractionBar({
  numerator,
  denominator,
  label,
}: {
  numerator: number;
  denominator: number;
  label: string;
}) {
  const safeDenominator = Math.max(1, Math.min(denominator, 24));
  const safeNumerator = Math.min(numerator, safeDenominator);
  const parts = Array.from({ length: safeDenominator }, (_, position) => ({
    id: `fraction-part-${position + 1}-of-${safeDenominator}`,
    isShaded: position < safeNumerator,
  }));
  return (
    <div className="space-y-3">
      <div
        className="grid overflow-hidden rounded-lg border border-[#8aa79c]"
        style={{
          gridTemplateColumns: `repeat(${safeDenominator}, minmax(0, 1fr))`,
        }}
      >
        {parts.map((part) => (
          <span
            key={part.id}
            className={`h-12 border-r border-white last:border-r-0 ${
              part.isShaded ? "bg-[#d99b4a]" : "bg-white"
            }`}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-[#41504b]">{label}</p>
    </div>
  );
}

function NumberLine({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  const safeDenominator = Math.max(2, Math.min(denominator, 20));
  const position = `${Math.min(100, (numerator / denominator) * 100)}%`;
  const ticks = Array.from({ length: safeDenominator + 1 }, (_, tick) => ({
    id: `tick-${tick}-of-${safeDenominator}`,
    left: `${(tick / safeDenominator) * 100}%`,
  }));
  return (
    <div className="px-2 py-4">
      <div className="relative h-12">
        <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-[#cfded7]" />
        {ticks.map((tick) => (
          <span
            key={tick.id}
            className="absolute top-3 h-5 w-px bg-[#2f6173]"
            style={{ left: tick.left }}
          />
        ))}
        <span
          className="absolute top-0 size-7 -translate-x-1/2 rounded-full bg-[#d99b4a] ring-4 ring-white"
          style={{ left: position }}
        />
        <span className="absolute left-0 top-10 text-xs font-semibold text-[#41504b]">
          0
        </span>
        <span className="absolute right-0 top-10 text-xs font-semibold text-[#41504b]">
          1
        </span>
      </div>
    </div>
  );
}

function DecimalChart({ value }: { value: string }) {
  const [whole, decimal = ""] = value.split(".");
  const digits = decimal.padEnd(3, "0").slice(0, 3).split("");
  const columns = [
    ["ones", whole],
    ["tenths", digits[0] ?? "0"],
    ["hundredths", digits[1] ?? "0"],
    ["thousandths", digits[2] ?? "0"],
  ];
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#cfded7] bg-white text-center">
      {columns.map(([label, digit]) => (
        <div key={label} className="border-r border-[#e7ded0] last:border-r-0">
          <p className="bg-[#f8efe1] px-2 py-2 text-xs font-semibold text-[#754714]">
            {label}
          </p>
          <p className="py-4 text-2xl font-bold text-[#10211f]">{digit}</p>
        </div>
      ))}
    </div>
  );
}

function PercentGrid({ percent }: { percent: number }) {
  const shaded = Math.max(0, Math.min(100, Math.round(percent)));
  const squares = Array.from({ length: 100 }, (_, position) => ({
    id: `percent-row-${Math.floor(position / 10)}-col-${position % 10}`,
    isShaded: position < shaded,
  }));
  return (
    <div className="space-y-3">
      <div className="grid w-fit grid-cols-10 gap-1">
        {squares.map((square) => (
          <span
            key={square.id}
            className={`size-2.5 rounded-sm ${
              square.isShaded ? "bg-[#2f6173]" : "bg-white"
            } border border-[#d9e7df]`}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-[#41504b]">
        {shaded} out of 100 parts
      </p>
    </div>
  );
}

function LessonVisual({ topic }: { topic: Topic }) {
  if (topic === "multiplication") {
    return (
      <VisualShell title="Visual model">
        <DotArray rows={4} columns={6} label="4 equal groups of 6 make 24" />
      </VisualShell>
    );
  }
  if (topic === "fractions") {
    return (
      <VisualShell title="Visual model">
        <FractionBar numerator={3} denominator={4} label="3 of 4 equal parts" />
      </VisualShell>
    );
  }
  if (topic === "decimals") {
    return (
      <VisualShell title="Visual model">
        <DecimalChart value="2.05" />
      </VisualShell>
    );
  }
  return (
    <VisualShell title="Visual model">
      <PercentGrid percent={25} />
    </VisualShell>
  );
}

function QuestionVisual({ question }: { question: Question }) {
  if (question.topic === "multiplication") {
    const [first = 4, second = 6, third] = numbersFromId(question.id);
    const rows = question.label === "Division story" ? second : first;
    const columns =
      question.label === "Division story" ? Number(question.answer) : second;
    const total =
      question.label === "Division story" && third ? first : rows * columns;
    return (
      <VisualShell title="See the structure">
        <DotArray
          rows={rows}
          columns={columns}
          label={`${rows} x ${columns} = ${total}`}
        />
      </VisualShell>
    );
  }

  if (question.topic === "fractions") {
    const fraction =
      extractFirstFraction(question.prompt) ??
      extractFirstFraction(question.answer);
    if (!fraction) return null;
    if (question.label === "Number line") {
      return (
        <VisualShell title="See the structure">
          <NumberLine
            numerator={fraction.numerator}
            denominator={fraction.denominator}
          />
        </VisualShell>
      );
    }
    return (
      <VisualShell title="See the structure">
        <FractionBar
          numerator={fraction.numerator}
          denominator={fraction.denominator}
          label={`${fraction.numerator}/${fraction.denominator} of one whole`}
        />
      </VisualShell>
    );
  }

  if (question.topic === "decimals") {
    const decimal = extractFirstDecimal(question.prompt) ?? question.answer;
    return (
      <VisualShell title="See the structure">
        <DecimalChart value={decimal} />
      </VisualShell>
    );
  }

  const percent = extractPercent(question.prompt);
  if (percent === null) return null;
  return (
    <VisualShell title="See the structure">
      <PercentGrid percent={percent} />
    </VisualShell>
  );
}

export function DailyPractice() {
  const [plan, setPlan] = useState(() => buildDailyPlan("2000-01-01", []));
  const [ready, setReady] = useState(false);
  const { todayTopic, lesson, questions, round: refresh } = plan;
  const topicLesson = topicLessons[todayTopic];
  const lessonVisualCue =
    lesson.visualCue ?? topicTeachingDefaults[todayTopic].visualCue;
  const lessonCheckPrompt =
    lesson.checkPrompt ?? topicTeachingDefaults[todayTopic].checkPrompt;
  const [stage, setStage] = useState<Stage>("goals");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, PracticeFeedback>>(
    {},
  );
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [sessionHistory, setSessionHistory] = useState<DailyPracticeRecord[]>(
    [],
  );
  const savedSummaryRef = useRef("");
  const current = questions[index];
  const currentDifficulty = estimateQuestionDifficulty(current);
  const selected = answers[current.id] ?? "";
  const selectedFeedback = feedback[current.id];
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
            (!isAnswerCorrect(question, answers[question.id] ?? "") ||
              (attempts[question.id] ?? 0) > 1 ||
              isConfidenceFlag(feedback[question.id])),
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
    const history = loadPracticeHistory();
    setSessionHistory(history);
    setPlan(resolveDailyPlan(practiceDate(), history, "start"));
    setReady(true);
  }, []);

  useEffect(() => {
    const saveSignature = JSON.stringify({
      answers,
      attempts,
      completed,
      feedback,
      refresh,
      topic: todayTopic,
    });
    if (!(stage === "summary" || completed) || !completed) return;
    if (savedSummaryRef.current === saveSignature) return;
    savedSummaryRef.current = saveSignature;
    const items: PracticeItemRecord[] = allQuestions.map((question) => {
      const selectedAnswer = answers[question.id] ?? "";
      const skillId = skillIdForLabel(question.label);
      return {
        id: question.id,
        topic: question.topic,
        skillId,
        skillName: skillNameForLabel(question.label),
        label: question.label,
        prompt: question.prompt,
        answer: question.answer,
        selected: selectedAnswer,
        correct: isAnswerCorrect(question, selectedAnswer),
        attempts: attempts[question.id] ?? 0,
        difficulty: estimateQuestionDifficulty(question),
        feedback: feedback[question.id],
      };
    });
    const record: DailyPracticeRecord = {
      id: `${plan.date}-${todayTopic}-${refresh}`,
      date: plan.date,
      completedAt: new Date().toISOString(),
      topic: todayTopic,
      lessonTitle: lesson.title,
      total: allQuestions.length,
      correct: correctCount,
      firstTryCorrect: firstTryCorrectCount,
      needsReview,
      items,
    };
    const nextHistory = [
      record,
      ...loadPracticeHistory().filter((item) => item.id !== record.id),
    ].slice(0, 20);
    setSessionHistory(nextHistory);
    try {
      window.localStorage.setItem(
        DAILY_PROGRESS_KEY,
        JSON.stringify(nextHistory),
      );
    } catch {
      // Local progress is helpful, but the practice should still work without it.
    }
  }, [
    allQuestions.length,
    allQuestions,
    answers,
    attempts,
    completed,
    correctCount,
    feedback,
    firstTryCorrectCount,
    lesson.title,
    needsReview,
    refresh,
    stage,
    todayTopic,
    plan.date,
  ]);

  function selectAnswer(answer: string) {
    if (isChecked && isAnswerCorrect(current, selected)) return;
    setAnswers((all) => ({ ...all, [current.id]: answer }));
    setFeedback((all) => {
      const nextFeedback = { ...all };
      delete nextFeedback[current.id];
      return nextFeedback;
    });
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
    savedSummaryRef.current = "";
    const history = loadPracticeHistory();
    const date = practiceDate();
    setSessionHistory(history);
    setPlan(
      resolveDailyPlan(
        date,
        history,
        "start",
        date === plan.date ? refresh + 1 : 0,
      ),
    );
    setStage("goals");
    setIndex(0);
    setAnswers({});
    setChecked({});
    setAttempts({});
    setFeedback({});
    setShowHint({});
  }

  function checkCurrent() {
    if (!selected) return;
    setAttempts((all) => ({
      ...all,
      [current.id]: (all[current.id] ?? 0) + 1,
    }));
    setChecked((all) => ({ ...all, [current.id]: true }));
    if (!isAnswerCorrect(current, selected)) {
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
    setFeedback((all) => {
      const nextFeedback = { ...all };
      delete nextFeedback[current.id];
      return nextFeedback;
    });
    setShowHint((all) => ({ ...all, [current.id]: true }));
  }

  if (!ready) return <output>Preparing today's practice...</output>;

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
            <div className="rounded-[2rem] border border-[#cfded7] bg-white/80 p-6">
              <p className="font-semibold text-[#24495a]">Picture it</p>
              <div className="mt-4">
                <LessonVisual topic={todayTopic} />
              </div>
              <p className="mt-3 leading-6 text-[#41504b]">{lessonVisualCue}</p>
            </div>
            <div className="rounded-[2rem] border border-[#dfd3c0] bg-[#f8efe1] p-6">
              <p className="font-semibold text-[#754714]">Say it back</p>
              <p className="mt-3 leading-6 text-[#754714]">
                {lessonCheckPrompt}
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
                    {skillNameForLabel(question.label)}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#94652e]">
                      {topicLabels[current.topic]}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClassName(currentDifficulty)}`}
                    >
                      {currentDifficulty}
                    </span>
                  </div>
                  <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
                    {current.prompt}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#53615c]">
                    Skill: {skillNameForLabel(current.label)}
                  </p>
                </div>
                <span className="rounded-full bg-[#dceaf0] px-4 py-2 text-sm font-semibold text-[#24495a]">
                  {index + 1} of {questions.length}
                </span>
              </div>

              <div className="mt-6">
                <QuestionVisual question={current} />
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
                  <div className="mt-4 rounded-2xl bg-white/60 p-4">
                    <p className="font-semibold">How did this feel?</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {feedbackChoices.map((choice) => (
                        <button
                          key={choice}
                          onClick={() =>
                            setFeedback((all) => ({
                              ...all,
                              [current.id]: choice,
                            }))
                          }
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            selectedFeedback === choice
                              ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                              : "border-[#d8cdbb] bg-white/75 text-[#53615c] hover:border-[#2f6173]"
                          }`}
                        >
                          {feedbackLabels[choice]}
                        </button>
                      ))}
                    </div>
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
                  : `${topicLabels[todayTopic]} with mixed practice`}
              </p>
            </div>
          </div>
          {sessionHistory.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">Recent practice</p>
              <div className="mt-3 grid gap-2">
                {sessionHistory.slice(0, 3).map((record) => (
                  <p
                    key={record.id}
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
