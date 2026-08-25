"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, Pill } from "@/components/masteryos/chrome";
import type { DiagnosticItem } from "@/lib/learning/assessment";
import type { DiagnosticSubmission } from "@/lib/learning/process";

function createAttemptId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function DiagnosticForm({ items }: { items: DiagnosticItem[] }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState(createAttemptId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemCount = useMemo(() => items.length, [items]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const submission: DiagnosticSubmission = {};
    for (const item of items) {
      submission[item.id] = {
        answer: getText(formData, `${item.id}_answer`),
        explanation: getText(formData, `${item.id}_explanation`),
        representation: getText(formData, `${item.id}_representation`) || "none",
        confidence: Number(formData.get(`${item.id}_confidence`) ?? 3),
        timeOnTaskSeconds: Number(formData.get(`${item.id}_time`) ?? 45) || 45,
      };
    }

    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, submission }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The diagnostic could not be saved.");
      setAttemptId(createAttemptId());
      router.refresh();
      router.push("/tutor?submitted=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The diagnostic could not be saved. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="diagnostic-status">
      <input type="hidden" name="attemptId" value={attemptId} />
      <div id="diagnostic-status" className="rounded-[1.5rem] border border-[#d8cdbb] bg-[#fffaf2] p-4 text-sm text-[#53615c]" aria-live="polite">
        <strong className="text-[#10211f]">How to use this diagnostic:</strong> answer all {itemCount} questions, then submit once. The button locks while the profile is updating so duplicate submissions do not create duplicate evidence.
      </div>
      {error ? <div className="rounded-[1.5rem] border border-[#d49a86] bg-[#fff2ed] p-4 font-semibold text-[#8a301f]" role="alert">{error}</div> : null}
      {items.map((item, index) => (
        <Card key={item.id}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Pill tone="blue">Item {index + 1}</Pill>
              <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
            </div>
            <Pill tone="amber">{item.competency}</Pill>
          </div>
          <p className="mb-4 text-lg text-[#263632]">{item.prompt}</p>
          <div className="grid gap-4 md:grid-cols-[1fr_.7fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#596762]">Answer</span>
              <input
                name={`${item.id}_answer`}
                placeholder={item.placeholder}
                required
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#596762]">Representation used</span>
              <select
                name={`${item.id}_representation`}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70"
              >
                <option value="none">None / mental</option>
                {item.representationOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-[#596762]">Explanation</span>
            <textarea
              name={`${item.id}_explanation`}
              placeholder="A short explanation is enough. The system scores mathematical substance, not length."
              disabled={isSubmitting}
              className="min-h-24 w-full rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-4 py-3 outline-none ring-[#2f6173] transition focus:ring-2 disabled:cursor-wait disabled:opacity-70"
            />
          </label>
          <div className="mt-4 rounded-2xl bg-[#f6f0e5] p-4">
            <p className="mb-3 text-sm font-semibold">How confident are you?</p>
            <div className="grid grid-cols-5 gap-2 text-sm">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-2 py-2 has-[:checked]:ring-2 has-[:checked]:ring-[#2f6173]">
                  <input type="radio" name={`${item.id}_confidence`} value={n} defaultChecked={n === 3} disabled={isSubmitting} /> {n}
                </label>
              ))}
            </div>
            <input type="hidden" name={`${item.id}_time`} value="45" />
          </div>
        </Card>
      ))}
      <div className="sticky bottom-4 rounded-[1.5rem] border border-[#dfd3c0] bg-[#10211f]/95 p-4 text-right shadow-2xl backdrop-blur">
        <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#d99b4a] px-7 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65">
          {isSubmitting ? "Updating learning profile…" : "Submit diagnostic and update learning profile"}
        </button>
      </div>
    </form>
  );
}