import assert from "node:assert/strict";
import { savePracticeRecordToDatabase, syncPracticeHistory } from "../src/lib/learning/practice-history-client";
import { DAILY_PROGRESS_KEY, type DailyPracticeRecord } from "../src/lib/learning/practice-progress";

const storage = new Map<string, string>();
Object.assign(globalThis, { window: {
  setTimeout, clearTimeout,
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
} });

const record: DailyPracticeRecord = {
  id: "session-a", date: "2026-09-19", completedAt: "2026-09-19T10:00:00.000Z",
  topic: "fractions", lessonTitle: "Equivalent fractions", total: 1, correct: 1,
  firstTryCorrect: 1, needsReview: [],
  items: [{ id: "question-a", topic: "fractions", label: "Equivalent fractions",
    prompt: "Which is equal to 1/2?", answer: "2/4", selected: "2/4", correct: true, attempts: 1 }],
};

async function main() {
  const originalFetch = globalThis.fetch;
  try {
    let completeRequest!: (response: Response) => void;
    globalThis.fetch = async () => new Promise<Response>((resolve) => { completeRequest = resolve; });
    const pending = savePracticeRecordToDatabase(record, [record]);
    const laterRecord = { ...record, id: "session-b", completedAt: "2026-09-19T11:00:00.000Z" };
    storage.set(DAILY_PROGRESS_KEY, JSON.stringify([laterRecord, record]));
    completeRequest(Response.json({ records: [record] }));
    const result = await pending;
    assert.equal(result.length, 2, "An older response must preserve a newly completed local session");
    assert.equal(JSON.parse(storage.get(DAILY_PROGRESS_KEY)!).length, 2);

    let posts = 0;
    globalThis.fetch = async (_input, init) => {
      if (init?.method === "POST") posts += 1;
      return Response.json({ records: [record] });
    };
    await syncPracticeHistory([record]);
    assert.equal(posts, 0, "Unchanged history must not be rewritten");

    storage.set(DAILY_PROGRESS_KEY, JSON.stringify([record]));
    globalThis.fetch = async () => { throw new Error("Offline"); };
    await assert.rejects(savePracticeRecordToDatabase(record, [record]), /Offline/);
    assert.equal(JSON.parse(storage.get(DAILY_PROGRESS_KEY)!)[0].id, record.id);
    console.log("History sync checks passed: late response preservation, read-only refresh, offline retention.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
