"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Lightbulb } from "lucide-react";

type PracticeItem = { itemId: string; position: number; item: { title: string; prompt: string; placeholder: string; representationOptions: unknown } };
type Entry = { answer: string; explanation: string; representation: string; confidence: number };
type Feedback = { correct: boolean; expectedAnswer: string; feedback: string };

function choices(value: unknown) { return Array.isArray(value) ? value.filter((choice): choice is string => typeof choice === "string") : []; }

export function PracticeFlow({ sessionId, practiceDate, items }: { sessionId: string; practiceDate: string; items: PracticeItem[] }) {
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = items[index];
  const entry = entries[current.itemId] ?? { answer: "", explanation: "", representation: "none", confidence: 3 };
  const result = feedback[current.itemId];
  const progress = useMemo(() => `${index + 1} of ${items.length}`, [index, items.length]);

  function update(patch: Partial<Entry>) { setEntries((all) => ({ ...all, [current.itemId]: { ...entry, ...patch } })); }

  async function checkAnswer() {
    if (!entry.answer.trim()) { setError("Type an answer first, then check it."); return; }
    setChecking(true); setError(null);
    try {
      const response = await fetch("/api/practice/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: current.itemId, ...entry }) });
      const data = (await response.json().catch(() => ({}))) as Feedback & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "I could not check that answer.");
      setFeedback((all) => ({ ...all, [current.itemId]: data }));
    } catch (checkError) { setError(checkError instanceof Error ? checkError.message : "I could not check that answer."); }
    finally { setChecking(false); }
  }

  async function next() {
    if (index < items.length - 1) { setIndex((value) => value + 1); return; }
    setSaving(true); setError(null);
    try {
      const submission = Object.fromEntries(items.map((item) => [item.itemId, { ...(entries[item.itemId] ?? { answer: "", explanation: "", representation: "none", confidence: 3 }), timeOnTaskSeconds: 45 }]));
      const response = await fetch("/api/today", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, attemptId: `daily-practice-${practiceDate}-${sessionId}`, submission }) });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Your practice could not be saved.");
      // A full navigation is intentionally used here. It is more reliable than
      // client-side routing in an iPad Home Screen web app after a long save.
      window.location.assign(`/today?completed=1&sessionId=${sessionId}`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Your practice could not be saved."); setSaving(false); }
  }

  return <main className="min-h-screen bg-[#f6f0e5] px-4 py-6 text-[#17211f] sm:px-6">
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between"><p className="font-serif text-3xl font-semibold">Today’s maths</p><span className="rounded-full bg-[#dceaf0] px-4 py-2 text-sm font-semibold text-[#24495a]">Question {progress}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5dccd]"><div className="h-full rounded-full bg-[#2f6173] transition-all" style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div>
      <section className="mt-6 rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#94652e]">{current.item.title}</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{current.item.prompt}</h1>
        <label className="mt-8 block"><span className="mb-2 block font-semibold">Your answer</span><input value={entry.answer} onChange={(event) => update({ answer: event.target.value })} disabled={Boolean(result) || checking || saving} placeholder={current.item.placeholder} className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-4 text-lg outline-none ring-[#2f6173] focus:ring-2" /></label>
        <label className="mt-5 block"><span className="mb-2 block font-semibold">Tell me why (optional)</span><textarea value={entry.explanation} onChange={(event) => update({ explanation: event.target.value })} disabled={Boolean(result) || checking || saving} placeholder="A short explanation is enough." className="min-h-24 w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] focus:ring-2" /></label>
        {!result ? <button onClick={checkAnswer} disabled={checking || saving} className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#10211f] px-6 py-4 font-semibold text-[#f8efe1] disabled:opacity-60">{checking ? "Checking…" : "Check my answer"}</button> : <div className={`mt-6 rounded-[1.5rem] p-5 ${result.correct ? "bg-[#edf7e8] text-[#244d32]" : "bg-[#fff3dd] text-[#754714]"}`}><div className="flex items-center gap-2 font-semibold">{result.correct ? <CheckCircle2 className="size-6" /> : <CircleAlert className="size-6" />}{result.correct ? "Correct!" : "Not quite yet"}</div><p className="mt-3 leading-6">{result.feedback}</p><div className="mt-4 rounded-2xl bg-white/55 p-4"><p className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" /> Expected answer</p><p className="mt-2 leading-6">{result.expectedAnswer}</p></div><button onClick={next} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-6 py-4 font-semibold text-[#f8efe1] disabled:opacity-60">{saving ? "Saving your practice…" : index === items.length - 1 ? "Finish my five questions" : "Next question"}<ArrowRight className="size-4" /></button></div>}
        {error ? <p role="alert" className="mt-4 rounded-2xl bg-[#fff0ec] p-4 text-sm font-semibold text-[#8a301f]">{error}</p> : null}
      </section>
      <p className="mt-5 text-center text-sm text-[#64716c]">Take your time. A mistake helps us choose what to practise next.</p>
    </div>
  </main>;
}