"use client";

import {
  mergePracticeHistories,
  normalizePracticeRecords,
  practiceRecordsNeedingUpload,
} from "./practice-history";
import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
} from "./practice-progress";

type HistoryResponse = { records?: unknown };

function mergeCurrentLocalHistory(records: DailyPracticeRecord[]) {
  try {
    const current = normalizePracticeRecords(
      JSON.parse(window.localStorage.getItem(DAILY_PROGRESS_KEY) ?? "[]"),
    );
    return mergePracticeHistories(records, current);
  } catch {
    return records;
  }
}

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
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
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
  let databaseRecords = await requestHistory("GET");
  const recordsToUpload = practiceRecordsNeedingUpload(
    localRecords,
    databaseRecords,
  );
  for (let offset = 0; offset < recordsToUpload.length; offset += 20) {
    databaseRecords = await requestHistory(
      "POST",
      recordsToUpload.slice(offset, offset + 20),
    );
  }
  const merged = mergeCurrentLocalHistory(
    mergePracticeHistories(localRecords, databaseRecords),
  );
  saveLocalHistory(merged);
  return merged;
}

export async function savePracticeRecordToDatabase(
  record: DailyPracticeRecord,
  localRecords: DailyPracticeRecord[],
  relatedUpdates: DailyPracticeRecord[] = [],
) {
  const recordsToSave = [record, ...relatedUpdates].filter(
    (candidate, index, records) =>
      records.findIndex((item) => item.id === candidate.id) === index,
  );
  const databaseRecords = await requestHistory("POST", recordsToSave);
  const merged = mergeCurrentLocalHistory(
    mergePracticeHistories(localRecords, databaseRecords),
  );
  saveLocalHistory(merged);
  return merged;
}
