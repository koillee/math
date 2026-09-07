"use client";

import { Card, Pill } from "@/components/masteryos/chrome";
import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
  LEGACY_DAILY_PROGRESS_KEY,
  practiceSupportNote,
  recommendedFocus,
  summarizeTopics,
  topicLabels,
} from "@/lib/learning/practice-progress";
import { ArrowRight, BookOpenCheck, RefreshCw, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function loadHistory() {
  try {
    const saved = window.localStorage.getItem(DAILY_PROGRESS_KEY);
    if (saved) return JSON.parse(saved).slice(0, 20) as DailyPracticeRecord[];
    const legacy = window.localStorage.getItem(LEGACY_DAILY_PROGRESS_KEY);
    if (!legacy) return [];
    return (JSON.parse(legacy) as Partial<DailyPracticeRecord>[])
      .filter((record) => record.date && record.topic)
      .map((record, index) => ({
        id: `legacy-${record.date}-${index}`,
        date: String(record.date),
        completedAt: String(record.completedAt ?? record.date),
        topic: record.topic as DailyPracticeRecord["topic"],
        lessonTitle: "Earlier daily practice",
        total: Number(record.total ?? 0),
        correct: Number(record.correct ?? 0),
        firstTryCorrect: Number(record.firstTryCorrect ?? record.correct ?? 0),
        needsReview: (record.needsReview ??
          []) as DailyPracticeRecord["needsReview"],
        items: record.items ?? [],
      }));
  } catch {
    return [];
  }
}

export function ParentSummaryClient() {
  const [records, setRecords] = useState<DailyPracticeRecord[]>([]);

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  const latest = records[0];
  const topicSummaries = useMemo(() => summarizeTopics(records), [records]);
  const focus = useMemo(() => recommendedFocus(records), [records]);
  const total = records.reduce((sum, record) => sum + record.total, 0);
  const correct = records.reduce((sum, record) => sum + record.correct, 0);
  const firstTry = records.reduce(
    (sum, record) => sum + record.firstTryCorrect,
    0,
  );
  const missedItems = records
    .flatMap((record) =>
      record.items
        .filter((item) => !item.correct)
        .map((item) => ({ ...item, date: record.date })),
    )
    .slice(0, 8);

  function refresh() {
    setRecords(loadHistory());
  }

  if (!records.length) {
    return (
      <Card className="bg-[#fffaf2]">
        <h3 className="text-2xl font-semibold">No practice saved yet</h3>
        <p className="mt-3 leading-7 text-[#53615c]">
          Once Haim finishes Daily Practice on this browser, this page will show
          what she worked on, what felt tricky, and what to review next.
        </p>
        <Link
          href="/daily-practice"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
        >
          Open Daily Practice
          <ArrowRight className="size-4" />
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="bg-[#fffaf2]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#64716c]">Recent practice</p>
            <h3 className="mt-1 text-3xl font-semibold">
              {correct}/{total} correct
            </h3>
            <p className="mt-2 leading-7 text-[#53615c]">
              First-try fluency: {firstTry}/{total}. Treat this as a calm signal
              for what to practise next, not as a score to worry about.
            </p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-white/80 px-4 py-2 font-semibold text-[#53615c]"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-5 text-[#2f6173]" />
            <h3 className="text-xl font-semibold">Latest session</h3>
          </div>
          <p className="mt-4 text-sm text-[#64716c]">{latest.date}</p>
          <p className="mt-2 text-lg font-semibold">
            {topicLabels[latest.topic]}
          </p>
          <p className="mt-2 leading-7 text-[#53615c]">
            Lesson: {latest.lessonTitle}
          </p>
          <p className="mt-2 leading-7 text-[#53615c]">
            Result: {latest.correct}/{latest.total}, with{" "}
            {latest.firstTryCorrect} correct on the first try.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Target className="size-5 text-[#2f6173]" />
            <h3 className="text-xl font-semibold">Next focus</h3>
          </div>
          <div className="mt-4">
            <Pill
              tone={
                records.some((record) => record.needsReview.length)
                  ? "amber"
                  : "green"
              }
            >
              {topicLabels[focus]}
            </Pill>
          </div>
          <p className="mt-4 leading-7 text-[#53615c]">
            {practiceSupportNote(focus)}
          </p>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold">Topic pattern</h3>
          <div className="mt-4 space-y-3">
            {topicSummaries.slice(0, 4).map((summary) => (
              <div key={summary.topic} className="rounded-2xl bg-[#f7fbf7] p-3">
                <p className="font-semibold">{topicLabels[summary.topic]}</p>
                <p className="mt-1 text-sm text-[#53615c]">
                  Practised {summary.practised}, missed {summary.missed},
                  first-try correct {summary.firstTryCorrect}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-semibold">Questions to revisit</h3>
        {missedItems.length ? (
          <div className="mt-4 grid gap-3">
            {missedItems.map((item) => (
              <div
                key={`${item.date}-${item.id}`}
                className="rounded-2xl bg-[#fff3dd] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{topicLabels[item.topic]}</p>
                  <span className="text-sm text-[#754714]">{item.date}</span>
                </div>
                <p className="mt-2 leading-7 text-[#754714]">{item.prompt}</p>
                <p className="mt-2 text-sm text-[#754714]">
                  Haim chose {item.selected || "no answer"}; answer:{" "}
                  {item.answer}.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 leading-7 text-[#53615c]">
            No missed questions saved in recent practice. Keep the daily session
            short and confident.
          </p>
        )}
      </Card>
    </div>
  );
}
