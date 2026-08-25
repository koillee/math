"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/masteryos/chrome";
import type { LearningActivitySubmission } from "@/lib/learning/process";

function createAttemptId(activityType: "next" | "retention") {
  const prefix = activityType === "retention" ? "retention" : "next-action";
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function NextActivityForm({ itemId, placeholder, representationOptions, activityType = "next" }: { itemId: string; placeholder: string; representationOptions: string[]; activityType?: "next" | "retention" }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState(() => createAttemptId(activityType));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const submission: LearningActivitySubmission = {
      answer: getText(formData, "answer"),
      explanation: getText(formData, "explanation"),
      representation: getText(formData, "representation") || "none",
      confidence: Number(formData.get("confidence") ?? 3),
      timeOnTaskSeconds: Number(formData.get("timeOnTaskSeconds") ?? 45) || 45,
    };

    try {
      const response = await fetch("/api/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, itemId, activityType, submission }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The next activity could not be saved.");
      setAttemptId(createAttemptId(activityType));
      router.refresh();
      router.push(activityType === "retention" ? "/tutor?retention=1" : "/tutor?next=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The next activity could not be saved. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="next-activity-status">
      <input type="hidden" name="attemptId" value={attemptId} />
      <div id="next-activity-status" className="rounded-[1.5rem] border border-[#d8cdbb] bg-[#fffaf2] p-4 text-sm text-[#53615c]" aria-live="polite">
        <strong className="text-[#10211f]">One focused activity:</strong> answer the item, explain your thinking, choose any representation you used, then submit once so the learning profile can update.
      </div>
      {error ? <div className="rounded-[1.5rem] border border-[#d49a86] bg-[#fff2ed] p-4 font-semibold text-[#8a301f]" role="alert">{error}</div> : null}
      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_.7fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#596762]">Answer</span>
            <input
              name="answer"
              placeholder={placeholder}
              required
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#596762]">Representation used</span>
            <select
              name="representation"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70"
            >
              <option value="none">None / mental</option>
              {representationOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-[#596762]">Explanation</span>
          <textarea
            name="explanation"
            placeholder="Explain why your answer makes sense. A short but clear reason is enough."
            disabled={isSubmitting}
            className="min-h-28 w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70"
          />
        </label>
        <div className="mt-4 rounded-2xl bg-[#f6f0e5] p-4">
          <p className="mb-3 text-sm font-semibold">How confident are you?</p>
          <div className="grid grid-cols-5 gap-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-2 py-2 has-[:checked]:ring-2 has-[:checked]:ring-[#2f6173]">
                <input type="radio" name="confidence" value={n} defaultChecked={n === 3} disabled={isSubmitting} /> {n}
              </label>
            ))}
          </div>
          <input type="hidden" name="timeOnTaskSeconds" value="45" />
        </div>
      </Card>
      <div className="sticky bottom-4 rounded-[1.5rem] border border-[#dfd3c0] bg-[#10211f]/95 p-4 text-right shadow-2xl backdrop-blur">
        <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#d99b4a] px-7 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65">
          {isSubmitting ? "Updating learning profile…" : activityType === "retention" ? "Submit retention practice and update profile" : "Submit next activity and update profile"}
        </button>
      </div>
    </form>
  );
}
