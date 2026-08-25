"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/masteryos/chrome";
import type { DailyPracticeSession, MathItem, SkillGraph } from "@prisma/client";

type PracticeItem = {
  itemId: string;
  position: number;
  reasonChosen: string;
  sourceType: string;
  item: MathItem & { skill: SkillGraph };
};

type SubmissionInput = {
  answer: string;
  explanation: string;
  representation: string;
  confidence: number;
  timeOnTaskSeconds: number;
};

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function practiceAttemptId(session: Pick<DailyPracticeSession, "id" | "practiceDate">) {
  return `daily-practice-${session.practiceDate}-${session.id}`;
}

export function TodayPracticeForm({ session, items }: { session: DailyPracticeSession; items: PracticeItem[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const submission: Record<string, SubmissionInput> = {};
    for (const item of items) {
      submission[item.itemId] = {
        answer: getText(formData, `answer-${item.itemId}`),
        explanation: getText(formData, `explanation-${item.itemId}`),
        representation: getText(formData, `representation-${item.itemId}`) || "none",
        confidence: Number(formData.get(`confidence-${item.itemId}`) ?? 3),
        timeOnTaskSeconds: 45,
      };
    }

    try {
      const response = await fetch("/api/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, attemptId: practiceAttemptId(session), submission }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Today's practice could not be saved.");
      router.refresh();
      router.push("/today?completed=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Today's practice could not be saved. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="today-practice-help" data-session-id={session.id} data-practice-date={session.practiceDate} data-practice-size={items.length}>
      <div id="today-practice-help" className="rounded-[1.5rem] border border-[#d8cdbb] bg-[#fffaf2] p-4 text-sm leading-6 text-[#53615c]" aria-live="polite">
        <strong className="text-[#10211f]">Try your best.</strong> A wrong answer is still useful because it tells MasteryOS what to review next.
      </div>
      {error ? <div className="rounded-[1.5rem] border border-[#d49a86] bg-[#fff2ed] p-4 font-semibold text-[#8a301f]" role="alert">{error}</div> : null}

      {items.map((practiceItem) => {
        const item = practiceItem.item;
        const representations = stringArray(item.representationOptions);
        return (
          <Card key={practiceItem.itemId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-[#94652e]">Problem {practiceItem.position} · {practiceItem.sourceType}</p>
                <h3 className="mt-1 text-2xl font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-[#64716c]">{item.skill.microSkill}</p>
              </div>
              <div className="rounded-full bg-[#f4dfbd] px-3 py-1 text-xs font-semibold text-[#754714]">difficulty {item.difficulty}/5</div>
            </div>
            <p className="mt-4 rounded-[1.25rem] bg-[#f6f0e5] p-4 text-lg leading-8 text-[#263632]">{item.prompt}</p>
            <p className="mt-3 text-sm leading-6 text-[#53615c]"><span className="font-semibold text-[#10211f]">Why this was chosen:</span> {practiceItem.reasonChosen}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_.7fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#596762]">Answer</span>
                <input name={`answer-${practiceItem.itemId}`} required disabled={isSubmitting} placeholder={item.placeholder} className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#596762]">Representation used</span>
                <select name={`representation-${practiceItem.itemId}`} disabled={isSubmitting} className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70">
                  <option value="none">None / mental</option>
                  {representations.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-[#596762]">Explanation</span>
              <textarea name={`explanation-${practiceItem.itemId}`} disabled={isSubmitting} placeholder="Explain why your answer makes sense. A short reason is enough." className="min-h-24 w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70" />
            </label>
            <div className="mt-4 rounded-2xl bg-[#f6f0e5] p-4">
              <p className="mb-3 text-sm font-semibold">How confident are you?</p>
              <div className="grid grid-cols-5 gap-2 text-sm">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-2 py-2 has-[:checked]:ring-2 has-[:checked]:ring-[#2f6173]">
                    <input type="radio" name={`confidence-${practiceItem.itemId}`} value={n} defaultChecked={n === 3} disabled={isSubmitting} /> {n}
                  </label>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      <div className="sticky bottom-4 rounded-[1.5rem] border border-[#dfd3c0] bg-[#10211f]/95 p-4 text-right shadow-2xl backdrop-blur">
        <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#d99b4a] px-7 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65">
          {isSubmitting ? "Saving today's practice…" : "Submit today's practice"}
        </button>
      </div>
    </form>
  );
}
