"use client";

import type {
  ReflectionPilotQuestion,
  ReflectionThinkingChoice,
  ReflectionTransferResult,
} from "@/lib/learning/reflection-pilot";
import { ArrowRight, CheckCircle2, CircleAlert, Sparkles } from "lucide-react";
import { useState } from "react";

type MissionMode = "repair" | "reason" | "delayed-review";

type ReflectionSource = {
  id: string;
  prompt: string;
  answer: string;
  selected: string;
};

export type ReflectionCompletion = {
  thinkingChoice?: ReflectionThinkingChoice;
  modelInteractionCompleted: boolean;
  transfer?: ReflectionTransferResult;
};

type Props = {
  mode: MissionMode;
  source?: ReflectionSource;
  transferQuestion: ReflectionPilotQuestion;
  onComplete: (completion: ReflectionCompletion) => void;
};

const repairReasons: {
  id: ReflectionThinkingChoice;
  label: string;
}[] = [
  {
    id: "changed-one-part",
    label: "I changed only the top or only the bottom.",
  },
  {
    id: "compared-digits",
    label: "I looked at the digits more than the amount.",
  },
  { id: "not-sure", label: "I was not sure how the pieces changed." },
];

const secureReasons: {
  id: ReflectionThinkingChoice;
  label: string;
}[] = [
  {
    id: "scaled-both",
    label: "I multiplied the top and bottom by the same number.",
  },
  {
    id: "same-amount",
    label: "I pictured the same amount split into more equal pieces.",
  },
  {
    id: "simplified-check",
    label: "I simplified the answer to check that it matched.",
  },
];

function FractionStrip({
  numerator,
  denominator,
  label,
}: {
  numerator: number;
  denominator: number;
  label: string;
}) {
  const parts = Array.from({ length: denominator }, (_, position) => ({
    id: `${label}-part-${position + 1}`,
    shaded: position < numerator,
  }));
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#53615c]">{label}</p>
      <div
        className="grid h-16 overflow-hidden rounded-xl border-2 border-[#2f6173] bg-white"
        style={{
          gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))`,
        }}
      >
        {parts.map((part) => (
          <span
            key={part.id}
            className={`border-r border-white last:border-r-0 ${
              part.shaded ? "bg-[#d99b4a]" : "bg-[#edf3ef]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ReflectionMission({
  mode,
  source,
  transferQuestion,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<"reason" | "model" | "transfer">(
    mode === "delayed-review" ? "transfer" : "reason",
  );
  const [thinkingChoice, setThinkingChoice] =
    useState<ReflectionThinkingChoice>();
  const [splitRevealed, setSplitRevealed] = useState(false);
  const [selected, setSelected] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<"try-again" | "correct" | "guided">();

  const isReasonMission = mode === "reason";
  const reasonChoices = isReasonMission ? secureReasons : repairReasons;
  const scaledNumerator =
    transferQuestion.baseNumerator * transferQuestion.scale;
  const scaledDenominator =
    transferQuestion.baseDenominator * transferQuestion.scale;

  function checkTransfer() {
    if (!selected || result === "correct" || result === "guided") return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (selected === transferQuestion.answer) {
      setResult("correct");
      return;
    }
    if (nextAttempts >= 2) {
      setResult("guided");
      return;
    }
    setResult("try-again");
    setSelected("");
  }

  function finish() {
    const transfer =
      mode === "reason"
        ? undefined
        : {
            questionId: transferQuestion.id,
            prompt: transferQuestion.prompt,
            answer: transferQuestion.answer,
            selected,
            correct: result === "correct",
            attempts,
            completedWithoutHint: result === "correct",
            guidedResolution: result === "guided",
          };
    onComplete({
      thinkingChoice,
      modelInteractionCompleted: splitRevealed,
      transfer,
    });
  }

  if (phase === "reason") {
    return (
      <section className="rounded-[2rem] border border-[#dfd3c0] bg-white/85 p-6 shadow-sm sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#94652e]">
          <Sparkles className="size-4" />
          One idea before 구구단
        </p>
        <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
          {isReasonMission
            ? "How did you know?"
            : "Let's fix one idea together."}
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-[#53615c]">
          Choose the thought closest to yours. This choice only helps the app
          choose an explanation. It is not a label or a grade.
        </p>
        {source ? (
          <div className="mt-5 rounded-2xl bg-[#fff8e9] p-4 text-[#754714]">
            <p className="font-semibold">The question we are looking at</p>
            <p className="mt-2 leading-6">{source.prompt}</p>
            <p className="mt-2 text-sm">
              Your answer: {source.selected || "No answer"} · Answer:{" "}
              {source.answer}
            </p>
          </div>
        ) : null}
        <div className="mt-5 grid gap-3">
          {reasonChoices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={thinkingChoice === choice.id}
              onClick={() => setThinkingChoice(choice.id)}
              className={`min-h-16 rounded-2xl border p-4 text-left font-semibold transition ${
                thinkingChoice === choice.id
                  ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                  : "border-[#d8cdbb] bg-[#fffdf8] text-[#53615c] hover:border-[#2f6173]"
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!thinkingChoice}
          onClick={() => setPhase("model")}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1] disabled:opacity-40"
        >
          See the idea
          <ArrowRight className="size-4" />
        </button>
      </section>
    );
  }

  if (phase === "model") {
    return (
      <section className="rounded-[2rem] border border-[#cfded7] bg-[#f7fbf7] p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-[#2f6173]">
          Same amount, new pieces
        </p>
        <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
          The amount stays still while every piece is split equally.
        </h2>
        <div className="mt-6 grid gap-5">
          <FractionStrip numerator={1} denominator={2} label="1/2" />
          {splitRevealed ? (
            <FractionStrip numerator={2} denominator={4} label="2/4" />
          ) : (
            <button
              type="button"
              onClick={() => setSplitRevealed(true)}
              className="min-h-16 rounded-2xl border-2 border-dashed border-[#2f6173] bg-white px-5 py-4 font-semibold text-[#24495a]"
            >
              Tap to split each half into 2 equal pieces
            </button>
          )}
        </div>
        {splitRevealed ? (
          <div className="mt-5 rounded-2xl bg-white p-5 leading-7 text-[#41504b]">
            <p className="font-semibold text-[#24495a]">1/2 = 2/4</p>
            <p className="mt-2">
              The coloured length did not change. The numerator and denominator
              both doubled because every old piece became two smaller pieces.
            </p>
          </div>
        ) : null}
        <button
          type="button"
          disabled={!splitRevealed}
          onClick={() => (isReasonMission ? finish() : setPhase("transfer"))}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1] disabled:opacity-40"
        >
          {isReasonMission ? "Finish reflection" : "Try one on my own"}
          <ArrowRight className="size-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-[#dfd3c0] bg-white/85 p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-[#94652e]">
        {mode === "delayed-review" ? "Three-day check" : "Now on your own"}
      </p>
      <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
        {transferQuestion.prompt}
      </h2>
      <p className="mt-3 leading-7 text-[#53615c]">
        {mode === "delayed-review"
          ? "No hint for this one. Take your time and think about how the amount can stay the same."
          : "No hint for this one. Take your time and use the idea you just saw."}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {transferQuestion.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={result === "correct" || result === "guided"}
            aria-pressed={selected === choice}
            onClick={() => {
              setSelected(choice);
              if (result === "try-again") setResult(undefined);
            }}
            className={`min-h-20 rounded-2xl border p-4 text-xl font-semibold transition ${
              selected === choice
                ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                : "border-[#d8cdbb] bg-[#fffdf8] hover:border-[#2f6173]"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
      {result === "try-again" ? (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-[#fff3dd] p-4 font-semibold text-[#754714]">
          <CircleAlert className="size-5" />
          Not yet. You have one final try.
        </p>
      ) : null}
      {result === "correct" ? (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-[#edf7e8] p-4 font-semibold text-[#244d32]">
          <CheckCircle2 className="size-5" />
          You solved the changed problem without a hint.
        </p>
      ) : null}
      {result === "guided" ? (
        <div className="mt-5 rounded-2xl bg-[#fff8e9] p-5 text-[#754714]">
          <p className="font-semibold">Let&apos;s finish this one together.</p>
          <p className="mt-2 leading-7">
            Multiply both parts by {transferQuestion.scale}:{" "}
            {transferQuestion.baseNumerator} × {transferQuestion.scale} ={" "}
            {scaledNumerator} and {transferQuestion.baseDenominator} ×{" "}
            {transferQuestion.scale} = {scaledDenominator}. The answer is{" "}
            {transferQuestion.answer}.
          </p>
          <div className="mt-4 grid gap-4">
            <FractionStrip
              numerator={transferQuestion.baseNumerator}
              denominator={transferQuestion.baseDenominator}
              label={`${transferQuestion.baseNumerator}/${transferQuestion.baseDenominator}`}
            />
            <FractionStrip
              numerator={scaledNumerator}
              denominator={scaledDenominator}
              label={transferQuestion.answer}
            />
          </div>
        </div>
      ) : null}
      {result === "correct" || result === "guided" ? (
        <button
          type="button"
          onClick={finish}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1]"
        >
          Finish this mission
          <ArrowRight className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={!selected}
          onClick={checkTransfer}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1] disabled:opacity-40"
        >
          Check my answer
        </button>
      )}
    </section>
  );
}
