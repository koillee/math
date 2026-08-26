"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExtraPracticeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function start() {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/practice/extra", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) throw new Error(data.error ?? "The extra set could not be prepared.");
      router.push(`/practice?sessionId=${data.sessionId}`);
    } catch (startError) { setError(startError instanceof Error ? startError.message : "The extra set could not be prepared."); setLoading(false); }
  }
  return <div><button onClick={start} disabled={loading} className="w-full rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1] disabled:opacity-60">{loading ? "Preparing another set…" : "Try another set of 5"}</button>{error ? <p role="alert" className="mt-2 text-sm font-semibold text-[#8a301f]">{error}</p> : null}</div>;
}