"use client";

import {
  mergePracticeHistories,
  normalizePracticeRecords,
} from "./practice-history";
import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
} from "./practice-progress";

type HistoryResponse = { records?: unknown };

function saveLocalHistory(records: DailyPracticeRecord[]) {
  try {
    window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(records));
  } catch {
    // Database sync can still succeed when browser storage is unavailable.
  }
}

async function requestHistory(
  method: "GET" | "POST",
  records?: DailyPracticeRecord[],
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3_500);
  try {
    const response = await fetch("/api/daily-practice/history", {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers:
        method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body:
        method === "POST"
          ? JSON.stringify({ records: records?.slice(0, 50) })
          : undefined,
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`Practice history request failed: ${response.status}`);
    const payload = (await response.json()) as HistoryResponse;
    return normalizePracticeRecords(payload.records);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function syncPracticeHistory(localRecords: DailyPracticeRecord[]) {
  const databaseRecords = await requestHistory(
    localRecords.length ? "POST" : "GET",
    localRecords,
  );
  const merged = mergePracticeHistories(localRecords, databaseRecords);
  saveLocalHistory(merged);
  return merged;
}

export async function savePracticeRecordToDatabase(
  record: DailyPracticeRecord,
  localRecords: DailyPracticeRecord[],
) {
  const recordsToSave = [
    record,
    ...localRecords.filter((candidate) => candidate.id !== record.id),
  ];
  const databaseRecords = await requestHistory("POST", recordsToSave);
  const merged = mergePracticeHistories(localRecords, databaseRecords);
  saveLocalHistory(merged);
  return merged;
}
