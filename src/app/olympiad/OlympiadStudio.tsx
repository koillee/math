"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Triangle,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  olympiadChallenges,
  type OlympiadChallenge,
  type OlympiadVisual,
} from "@/lib/olympiad/challenges";

type Outcome = "independent" | "hinted" | "together";
type ChallengeProgress = {
  warmUpAnswer: string;
  warmUpChecked: boolean;
  notes: string;
  stretchNotes: string;
  hintsShown: number;
  solutionShown: boolean;
  outcome?: Outcome;
};

const STORAGE_KEY = "haim-olympiad-progress-v1";

const blankProgress = (): ChallengeProgress => ({
  warmUpAnswer: "",
  warmUpChecked: false,
  notes: "",
  stretchNotes: "",
  hintsShown: 0,
  solutionShown: false,
});

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function warmUpIsCorrect(challenge: OlympiadChallenge, answer: string) {
  const normalized = normalize(answer);
  return challenge.warmUp.acceptedAnswers.some(
    (accepted) => normalize(accepted) === normalized,
  );
}

function CycleVisual() {
  const shapes = [Star, Circle, Triangle, Circle, Star, Circle, Triangle, Circle];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {shapes.map((Shape, index) => (
          <div
            key={`${Shape.displayName}-${index}`}
            className="grid size-12 place-items-center rounded-lg border border-[#cfded7] bg-white text-[#2f6173]"
          >
            <Shape
              className={`size-6 ${index % 4 === 0 ? "fill-[#d99b4a] text-[#94652e]" : ""}`}
            />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto grid min-w-[680px] grid-cols-[64px_repeat(24,minmax(22px,1fr))] text-center text-[10px]">
          <div className="py-2 text-left font-semibold text-[#53615c]">Beat</div>
          {Array.from({ length: 24 }, (_, index) => (
            <div
              key={`beat-${index}`}
              className={`border border-[#dfe7e3] py-2 font-semibold ${
                index === 23 ? "bg-[#fff1d8] text-[#754714]" : "bg-white text-[#64716c]"
              }`}
            >
              {index + 1}
            </div>
          ))}
          <div className="py-2 text-left font-semibold text-[#2f6173]">Spark</div>
          {Array.from({ length: 24 }, (_, index) => {
            const moves = (index + 1) % 6 === 0;
            return (
              <div
                key={`spark-${index}`}
                className={`grid min-h-8 place-items-center border border-[#dfe7e3] ${
                  index === 23 ? "bg-[#fff1d8]" : "bg-white"
                }`}
                aria-label={moves ? `Spark moves on beat ${index + 1}` : undefined}
              >
                {moves && <span className="size-3 rounded-full bg-[#2f6173]" />}
              </div>
            );
          })}
          <div className="py-2 text-left font-semibold text-[#94652e]">Wave</div>
          {Array.from({ length: 24 }, (_, index) => {
            const moves = (index + 1) % 8 === 0;
            return (
              <div
                key={`wave-${index}`}
                className={`grid min-h-8 place-items-center border border-[#dfe7e3] ${
                  index === 23 ? "bg-[#fff1d8]" : "bg-white"
                }`}
                aria-label={moves ? `Wave moves on beat ${index + 1}` : undefined}
              >
                {moves && <span className="size-3 rounded-full bg-[#d99b4a]" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LineUpVisual() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="grid min-h-20 place-items-center rounded-lg border border-[#9db9ad] bg-white"
        >
          <div className="grid size-7 place-items-center rounded-full bg-[#d99b4a] text-xs font-bold text-[#10211f]">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function RectangleVisual() {
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-4 overflow-hidden rounded-lg border border-[#10211f] bg-white">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="aspect-square border border-[#759087]" />
      ))}
    </div>
  );
}

function RatioVisual() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 overflow-hidden rounded-lg border border-[#c7b48f]">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={`grid h-16 place-items-center border-r border-white/80 text-sm font-bold last:border-r-0 ${
              index < 3
                ? "bg-[#f4dfbd] text-[#754714]"
                : "bg-[#dceaf0] text-[#24495a]"
            }`}
          >
            {index < 3 ? "Star" : "Heart"}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-8 text-sm font-semibold text-[#53615c]">
        <span>Before 3 : 2</span>
        <span>After 1 : 1</span>
      </div>
    </div>
  );
}

function DigitVisual() {
  return (
    <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
      {["Hundreds", "Tens", "Ones"].map((label) => (
        <div
          key={label}
          className="grid min-h-24 place-items-center rounded-lg border border-[#9db9ad] bg-white p-3 text-center"
        >
          <div>
            <p className="text-xs font-semibold text-[#64716c]">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#d99b4a]">?</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BackwardsVisual() {
  const steps = ["Start", "Give away 1/3", "Use 8", "Half remains"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={step} className="contents">
          <div
            className={`grid min-h-16 min-w-28 place-items-center rounded-lg border px-3 text-center text-sm font-semibold ${
              index === steps.length - 1
                ? "border-[#9db9ad] bg-[#dfe9d6] text-[#36582e]"
                : "border-[#d5bf96] bg-white text-[#17211f]"
            }`}
          >
            {step}
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className="size-5 shrink-0 text-[#94652e]" />
          )}
        </div>
      ))}
    </div>
  );
}

function FourGrid({ removed }: { removed: number[] }) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-[#10211f] bg-white">
      {Array.from({ length: 16 }, (_, index) => (
        <div
          key={index}
          className={`grid aspect-square place-items-center border border-[#759087] ${
            removed.includes(index) ? "bg-[#e4ded4] text-[#b4513d]" : ""
          }`}
        >
          {removed.includes(index) && <X className="size-6" />}
        </div>
      ))}
    </div>
  );
}

function PerimeterVisual() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <FourGrid removed={[0, 3, 12, 15]} />
        <p className="mt-2 text-center text-xs font-semibold text-[#64716c]">
          Shape A · corners removed
        </p>
      </div>
      <div>
        <FourGrid removed={[5, 6, 9, 10]} />
        <p className="mt-2 text-center text-xs font-semibold text-[#64716c]">
          Shape B · centre removed
        </p>
      </div>
    </div>
  );
}

function RouteVisual() {
  const points = Array.from({ length: 16 }, (_, index) => ({
    x: index % 4,
    y: Math.floor(index / 4),
  }));
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative aspect-square">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`horizontal-${index}`}
            className="absolute left-[8%] right-[8%] h-px bg-[#759087]"
            style={{ top: `${8 + index * 28}%` }}
          />
        ))}
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`vertical-${index}`}
            className="absolute bottom-[8%] top-[8%] w-px bg-[#759087]"
            style={{ left: `${8 + index * 28}%` }}
          />
        ))}
        {points.map((point) => {
          const blocked = point.x === 1 && point.y === 2;
          return (
            <div
              key={`${point.x}-${point.y}`}
              className={`absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${
                blocked ? "bg-[#f2d9d3] text-[#b4513d]" : "bg-[#10211f]"
              }`}
              style={{
                left: `${8 + point.x * 28}%`,
                top: `${8 + point.y * 28}%`,
              }}
            >
              {blocked && <X className="size-3" />}
            </div>
          );
        })}
        <span className="absolute bottom-0 left-0 text-xs font-bold text-[#53615c]">
          START
        </span>
        <span className="absolute right-0 top-0 text-xs font-bold text-[#53615c]">
          FINISH
        </span>
      </div>
    </div>
  );
}

function ChallengeVisual({ visual }: { visual: OlympiadVisual }) {
  if (visual === "cycles") return <CycleVisual />;
  if (visual === "line-up") return <LineUpVisual />;
  if (visual === "rectangles") return <RectangleVisual />;
  if (visual === "ratios") return <RatioVisual />;
  if (visual === "digits") return <DigitVisual />;
  if (visual === "backwards") return <BackwardsVisual />;
  if (visual === "perimeter") return <PerimeterVisual />;
  return <RouteVisual />;
}

const outcomeLabels: Record<Outcome, string> = {
  independent: "Solved myself",
  hinted: "Solved with a hint",
  together: "Solved together",
};

export function OlympiadStudio() {
  const [selectedId, setSelectedId] = useState(olympiadChallenges[0].id);
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch {
      setProgress({});
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [loaded, progress]);

  const challenge = useMemo(
    () =>
      olympiadChallenges.find((item) => item.id === selectedId) ??
      olympiadChallenges[0],
    [selectedId],
  );
  const current = progress[challenge.id] ?? blankProgress();
  const currentIndex = olympiadChallenges.findIndex(
    (item) => item.id === challenge.id,
  );
  const completedCount = Object.values(progress).filter(
    (entry) => entry.outcome,
  ).length;
  const warmCorrect =
    current.warmUpChecked &&
    warmUpIsCorrect(challenge, current.warmUpAnswer);

  function update(patch: Partial<ChallengeProgress>) {
    setProgress((all) => ({
      ...all,
      [challenge.id]: { ...blankProgress(), ...all[challenge.id], ...patch },
    }));
  }

  function chooseChallenge(id: string) {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function move(amount: number) {
    const next = olympiadChallenges[currentIndex + amount];
    if (next) chooseChallenge(next.id);
  }

  function resetCurrent() {
    setProgress((all) => {
      const copy = { ...all };
      delete copy[challenge.id];
      return copy;
    });
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-6 text-[#f8efe1] shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d99b4a]">
              Challenge Studio
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
              Olympiad
            </h1>
            <p className="mt-4 text-lg leading-7 text-[#d8cdbb]">
              Think slowly, draw what you notice, and take one hint at a time.
            </p>
          </div>
          <div className="grid size-16 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]">
            <Trophy className="size-8" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-4 py-2 font-semibold text-[#f2d8b0]">
            {completedCount} of {olympiadChallenges.length} explored
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2 font-semibold text-[#d8cdbb]">
            Separate from daily mastery
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {olympiadChallenges.map((item) => {
          const itemProgress = progress[item.id];
          const selected = item.id === challenge.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseChallenge(item.id)}
              className={`min-h-28 rounded-lg border p-4 text-left transition ${
                selected
                  ? "border-[#10211f] bg-[#10211f] text-[#f8efe1] shadow-lg"
                  : "border-[#dfd3c0] bg-white/80 text-[#17211f] hover:border-[#9db9ad]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                    selected
                      ? "bg-[#d99b4a] text-[#10211f]"
                      : "bg-[#f4dfbd] text-[#754714]"
                  }`}
                >
                  {item.session}
                </span>
                {itemProgress?.outcome && (
                  <CheckCircle2
                    className={`size-5 ${selected ? "text-[#d99b4a]" : "text-[#3c725f]"}`}
                  />
                )}
              </div>
              <p className="mt-3 font-semibold leading-5">{item.title}</p>
              <p
                className={`mt-1 text-xs ${selected ? "text-[#d8cdbb]" : "text-[#64716c]"}`}
              >
                Week {item.week} · {item.strategy}
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/85 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f4dfbd] px-3 py-1 text-xs font-bold text-[#754714]">
                Session {challenge.session}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#dceaf0] px-3 py-1 text-xs font-semibold text-[#24495a]">
                <Clock3 className="size-3.5" />
                About {challenge.expectedMinutes} minutes
              </span>
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#10211f] sm:text-4xl">
              {challenge.title}
            </h2>
            <p className="mt-2 font-semibold text-[#2f6173]">
              {challenge.strategy}
            </p>
          </div>
          <button
            type="button"
            onClick={resetCurrent}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#cfded7] text-[#53615c] transition hover:bg-[#f7fbf7]"
            title="Reset this challenge"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="mt-7 border-t border-[#e1d8c8] pt-7">
          <div className="flex items-center gap-2 text-[#754714]">
            <Sparkles className="size-5" />
            <h3 className="text-lg font-semibold">Warm-up</h3>
          </div>
          <p className="mt-3 text-lg leading-7">{challenge.warmUp.prompt}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={current.warmUpAnswer}
              onChange={(event) =>
                update({
                  warmUpAnswer: event.target.value,
                  warmUpChecked: false,
                })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && current.warmUpAnswer.trim())
                  update({ warmUpChecked: true });
              }}
              placeholder="Your answer"
              className="min-h-12 flex-1 rounded-lg border border-[#c7bca9] bg-white px-4 text-base outline-none transition focus:border-[#2f6173] focus:ring-2 focus:ring-[#2f6173]/15"
            />
            <button
              type="button"
              disabled={!current.warmUpAnswer.trim()}
              onClick={() => update({ warmUpChecked: true })}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#10211f] px-5 font-semibold text-[#f8efe1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="size-4" />
              Check
            </button>
          </div>
          {current.warmUpChecked && (
            <div
              className={`mt-4 rounded-lg border p-4 ${
                warmCorrect
                  ? "border-[#bad3c2] bg-[#edf5ef] text-[#36582e]"
                  : "border-[#e6c5b9] bg-[#fbefea] text-[#7f3526]"
              }`}
            >
              <p className="font-semibold">
                {warmCorrect ? "That works." : `The answer is ${challenge.warmUp.answer}.`}
              </p>
              <p className="mt-1 leading-6">{challenge.warmUp.explanation}</p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-[#e1d8c8] pt-7">
          <div className="flex items-center gap-2 text-[#24495a]">
            <Target className="size-5" />
            <h3 className="text-lg font-semibold">Main challenge</h3>
          </div>
          <p className="mt-3 text-lg leading-7">{challenge.mainPrompt}</p>
          <div className="mt-6 rounded-lg border border-[#cfded7] bg-[#f7fbf7] p-4 sm:p-6">
            <ChallengeVisual visual={challenge.visual} />
          </div>

          <label className="mt-6 block text-sm font-semibold text-[#53615c]" htmlFor="olympiad-notes">
            My thinking
          </label>
          <textarea
            id="olympiad-notes"
            value={current.notes}
            onChange={(event) => update({ notes: event.target.value })}
            placeholder="Write a table, equations, cases, or an explanation..."
            className="mt-2 min-h-36 w-full resize-y rounded-lg border border-[#c7bca9] bg-white p-4 leading-6 outline-none transition focus:border-[#2f6173] focus:ring-2 focus:ring-[#2f6173]/15"
          />

          <div className="mt-5 space-y-3">
            {challenge.hints
              .slice(0, current.hintsShown)
              .map((hint, index) => (
                <div
                  key={hint}
                  className="flex gap-3 rounded-lg border border-[#e3c78f] bg-[#fff7e7] p-4"
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d99b4a] text-xs font-bold text-[#10211f]">
                    {index + 1}
                  </div>
                  <p className="leading-6 text-[#754714]">{hint}</p>
                </div>
              ))}
            {current.hintsShown < challenge.hints.length && (
              <button
                type="button"
                onClick={() =>
                  update({ hintsShown: current.hintsShown + 1 })
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d5bf96] bg-white px-4 font-semibold text-[#754714] transition hover:bg-[#fff7e7]"
              >
                <Lightbulb className="size-4" />
                Show hint {current.hintsShown + 1}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => update({ solutionShown: !current.solutionShown })}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f6173] px-5 font-semibold text-white"
          >
            <Eye className="size-4" />
            {current.solutionShown ? "Hide solution" : "Compare with solution"}
          </button>

          {current.solutionShown && (
            <div className="mt-4 space-y-4 rounded-lg border border-[#9db9ad] bg-[#edf4f1] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6173]">
                  Answer
                </p>
                <p className="mt-2 text-lg font-semibold text-[#10211f]">
                  {challenge.answer}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#10211f]">One clear route</p>
                <p className="mt-1 leading-6 text-[#41504b]">
                  {challenge.solution}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#10211f]">Another route</p>
                <p className="mt-1 leading-6 text-[#41504b]">
                  {challenge.alternative}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-[#e1d8c8] pt-7">
          <div className="flex items-center gap-2 text-[#754714]">
            <Star className="size-5" />
            <h3 className="text-lg font-semibold">Optional stretch</h3>
          </div>
          <p className="mt-3 leading-7">{challenge.stretch.prompt}</p>
          <textarea
            value={current.stretchNotes}
            onChange={(event) => update({ stretchNotes: event.target.value })}
            placeholder="Try the extension here..."
            className="mt-3 min-h-24 w-full resize-y rounded-lg border border-[#d5bf96] bg-[#fffaf0] p-4 leading-6 outline-none transition focus:border-[#94652e] focus:ring-2 focus:ring-[#d99b4a]/20"
          />
          <details className="mt-3 rounded-lg border border-[#e3c78f] bg-white p-4">
            <summary className="cursor-pointer font-semibold text-[#754714]">
              Stretch answer
            </summary>
            <p className="mt-3 leading-6 text-[#53615c]">
              {challenge.stretch.answer}
            </p>
          </details>
        </div>

        <div className="mt-8 border-t border-[#e1d8c8] pt-7">
          <h3 className="text-lg font-semibold">How did this one go?</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(outcomeLabels) as Outcome[]).map((outcome) => (
              <button
                key={outcome}
                type="button"
                onClick={() => update({ outcome })}
                className={`min-h-12 rounded-lg border px-4 font-semibold transition ${
                  current.outcome === outcome
                    ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                    : "border-[#cfded7] bg-white text-[#41504b] hover:bg-[#f7fbf7]"
                }`}
              >
                {outcomeLabels[outcome]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[#e1d8c8] pt-6">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => move(-1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cfded7] px-4 font-semibold text-[#41504b] disabled:opacity-30"
          >
            <ArrowLeft className="size-4" />
            Previous
          </button>
          <button
            type="button"
            disabled={currentIndex === olympiadChallenges.length - 1}
            onClick={() => move(1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#10211f] px-4 font-semibold text-[#f8efe1] disabled:opacity-30"
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
