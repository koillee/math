"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardResetButton() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reset() {
    if (isResetting) return;
    setIsResetting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Reset failed.");
      setMessage("MVP evidence reset. The dashboard is ready for a fresh diagnostic.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reset failed.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" onClick={reset} disabled={isResetting} className="text-sm font-semibold text-[#8a4d1f] underline disabled:cursor-wait disabled:opacity-60">
        {isResetting ? "Resetting MVP evidence…" : "Reset MVP evidence data"}
      </button>
      {message ? <output className="text-sm text-[#64716c]">{message}</output> : null}
    </div>
  );
}