"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, CircleAlert, Lightbulb, RotateCcw } from "lucide-react";
import type { Choice, RetryPrompt, TutorTopic } from "@/lib/learning/daily-tutor";

type PracticeItem = {
  itemId: string;
  position: number;
  item: {
    title: string;
    prompt: string;
    expectedAnswer: string;
    placeholder: string;
    choices: Choice[];
  };
};
type Entry = { answer: string; explanation: string; representation: string; confidence: number };
type Feedback = { correct: boolean; expectedAnswer: string; feedback: string; repair?: { message: string; retry: RetryPrompt } | null };
type RetryState = { selected: string; checked: boolean; correct: boolean; feedback: string };

export function PracticeFlow({ sessionId, practiceDate, topic, items }: { sessionId: string; practiceDate: string; topic: TutorTopic; items: PracticeItem[] }) {
  const [stage, setStage] = useState<"lesson" | "practice">("lesson");
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [retry, setRetry] = useState<Record<string, RetryState>>({});
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = items[index];
  const entry = entries[current.itemId] ?? { answer: "", explanation: "", representation: "multiple choice", confidence: 3 };
  const result = feedback[current.itemId];
  const currentRetry = retry[current.itemId] ?? { selected: "", checked: false, correct: false, feedback: "" };
  const progress = useMemo(() => `${index + 1} of ${items.length}`, [index, items.length]);

  function update(patch: Partial<Entry>) {
    setEntries((all) => ({ ...all, [current.itemId]: { ...entry, ...patch } }));
  }

  function selectChoice(choice: Choice) {
    if (result || checking || saving) return;
    update({ answer: choice.label });
  }

  async function checkAnswer() {
    if (!entry.answer.trim()) {
      setError("Choose an answer first, then check it.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/practice/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: current.itemId, ...entry }) });
      const data = (await response.json().catch(() => ({}))) as Feedback & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "I could not check that answer.");
      setFeedback((all) => ({ ...all, [current.itemId]: data }));
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "I could not check that answer.");
    } finally {
      setChecking(false);
    }
  }

  async function next() {
    if (index < items.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const submission = Object.fromEntries(items.map((item) => [item.itemId, { ...(entries[item.itemId] ?? { answer: "", explanation: "", representation: "multiple choice", confidence: 3 }), timeOnTaskSeconds: 60 }]));
      const response = await fetch("/api/today", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, attemptId: `daily-practice-${practiceDate}-${sessionId}`, submission }) });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Your practice could not be saved.");
      window.location.assign(`/today?completed=1&sessionId=${sessionId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your practice could not be saved.");
      setSaving(false);
    }
  }

  function selectRetryChoice(choice: Choice) {
    if (!result?.repair || currentRetry.checked) return;
    setRetry((all) => ({ ...all, [current.itemId]: { selected: choice.label, checked: false, correct: choice.correct, feedback: choice.feedback } }));
  }

  function checkRetry() {
    if (!currentRetry.selected) {
      setError("Choose one retry answer first.");
      return;
    }
    setError(null);
    setRetry((all) => ({ ...all, [current.itemId]: { ...currentRetry, checked: true } }));
  }

  if (stage === "lesson") {
    return <main className="min-h-screen bg-[#f6f0e5] px-4 py-6 text-[#17211f] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between"><p className="font-serif text-3xl font-semibold">Today’s tutor</p><span className="rounded-full bg-[#dceaf0] px-4 py-2 text-sm font-semibold text-[#24495a]">Mini lesson</span></div>
        <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-7 text-[#f8efe1] shadow-xl sm:p-10">
          <p className="inline-flex rounded-full bg-[#d99b4a] px-4 py-2 text-sm font-bold text-[#10211f]">{topic.shortTitle}</p>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{topic.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[#d8cdbb]">{topic.subtitle}</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-[#f2d8b0]">{topic.schoolLink}</p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><BookOpenCheck className="size-6 text-[#2f6173]" /> Key idea</h2>
            <ul className="mt-5 space-y-4 text-lg leading-7 text-[#41504b]">
              {topic.miniLesson.map((line) => <li key={line} className="rounded-2xl bg-[#f7fbf7] p-4">{line}</li>)}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-[#d5bd95] bg-[#fff8e9] p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Worked example</h2>
            <p className="mt-4 rounded-2xl bg-white/70 p-4 font-serif text-2xl font-semibold">{topic.workedExample.problem}</p>
            <ol className="mt-4 space-y-3 text-[#53615c]">
              {topic.workedExample.steps.map((step, stepIndex) => <li key={step} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d99b4a] text-sm font-bold text-[#10211f]">{stepIndex + 1}</span><span>{step}</span></li>)}
            </ol>
            <p className="mt-5 rounded-2xl bg-[#10211f] p-4 text-lg font-semibold text-[#f8efe1]">Answer: {topic.workedExample.answer}</p>
          </div>
        </section>

        <button onClick={() => setStage("practice")} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-6 py-4 text-lg font-semibold text-[#f8efe1]">Start five practice questions <ArrowRight className="size-5" /></button>
      </div>
    </main>;
  }

  return <main className="min-h-screen bg-[#f6f0e5] px-4 py-6 text-[#17211f] sm:px-6">
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between"><div><p className="font-serif text-3xl font-semibold">Today’s maths</p><p className="mt-1 text-sm font-semibold text-[#94652e]">{topic.shortTitle}</p></div><span className="rounded-full bg-[#dceaf0] px-4 py-2 text-sm font-semibold text-[#24495a]">Question {progress}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5dccd]"><div className="h-full rounded-full bg-[#2f6173] transition-all" style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div>
      <section className="mt-6 rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#94652e]">{current.item.title}</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{current.item.prompt}</h1>

        <div className="mt-8">
          <p className="mb-3 block font-semibold">Choose your answer</p>
          <div className="grid gap-3">
            {current.item.choices.map((choice) => {
              const selected = entry.answer === choice.label;
              return <button key={choice.id} onClick={() => selectChoice(choice)} disabled={Boolean(result) || checking || saving} className={`rounded-2xl border p-4 text-left text-lg font-semibold transition ${selected ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]" : "border-[#d8cdbb] bg-[#fffdf8] text-[#17211f] hover:border-[#2f6173] hover:bg-[#f7fbf7]"} disabled:cursor-default disabled:opacity-80`} aria-pressed={selected}>{choice.label}</button>;
            })}
          </div>
        </div>

        <label className="mt-5 block"><span className="mb-2 block font-semibold">Tell me why (optional)</span><textarea value={entry.explanation} onChange={(event) => update({ explanation: event.target.value })} disabled={Boolean(result) || checking || saving} placeholder="A short explanation is enough." className="min-h-24 w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] focus:ring-2" /></label>
        {!result ? <button onClick={checkAnswer} disabled={checking || saving || !entry.answer.trim()} className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#10211f] px-6 py-4 font-semibold text-[#f8efe1] disabled:opacity-60">{checking ? "Checking…" : "Check my answer"}</button> : <div className={`mt-6 rounded-[1.5rem] p-5 ${result.correct ? "bg-[#edf7e8] text-[#244d32]" : "bg-[#fff3dd] text-[#754714]"}`}><div className="flex items-center gap-2 font-semibold">{result.correct ? <CheckCircle2 className="size-6" /> : <CircleAlert className="size-6" />}{result.correct ? "Correct!" : "Not quite yet"}</div><p className="mt-3 leading-6">{result.feedback}</p><div className="mt-4 rounded-2xl bg-white/55 p-4"><p className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" /> Expected answer</p><p className="mt-2 leading-6">{result.expectedAnswer}</p></div>{!result.correct && result.repair ? <div className="mt-4 rounded-2xl border border-[#e4bf82] bg-white/60 p-4"><p className="flex items-center gap-2 font-semibold"><RotateCcw className="size-4" /> Similar retry</p><p className="mt-2 leading-6">{result.repair.message}</p><p className="mt-3 font-semibold text-[#10211f]">{result.repair.retry.prompt}</p><div className="mt-3 grid gap-2">{result.repair.retry.choices.map((choice) => <button key={choice.id} onClick={() => selectRetryChoice(choice)} disabled={currentRetry.checked} className={`rounded-xl border px-3 py-2 text-left font-semibold ${currentRetry.selected === choice.label ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]" : "border-[#d8cdbb] bg-white/70"}`} aria-pressed={currentRetry.selected === choice.label}>{choice.label}</button>)}</div>{currentRetry.selected && !currentRetry.checked ? <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-semibold text-[#24495a]" aria-live="polite">Retry answer selected: {currentRetry.selected}. Now check it.</p> : null}{currentRetry.checked ? <p className={`mt-3 rounded-xl p-3 text-sm font-semibold ${currentRetry.correct ? "bg-[#edf7e8] text-[#244d32]" : "bg-[#fff0ec] text-[#8a301f]"}`} aria-live="polite">{currentRetry.correct ? `Retry correct — good repair. ${currentRetry.feedback}` : result.repair.retry.explanation}</p> : <button onClick={checkRetry} disabled={!currentRetry.selected} className="mt-3 rounded-full bg-[#2f6173] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Check retry</button>}</div> : null}<button onClick={next} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-6 py-4 font-semibold text-[#f8efe1] disabled:opacity-60">{saving ? "Saving your practice…" : index === items.length - 1 ? "Finish my five questions" : "Next question"}<ArrowRight className="size-4" /></button></div>}
        {error ? <p role="alert" className="mt-4 rounded-2xl bg-[#fff0ec] p-4 text-sm font-semibold text-[#8a301f]">{error}</p> : null}
      </section>
      <p className="mt-5 text-center text-sm text-[#64716c]">Take your time. A mistake helps us choose what to practise next.</p>
    </div>
  </main>;
}