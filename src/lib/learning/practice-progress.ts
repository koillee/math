export type PracticeTopic =
  | "multiplication"
  | "fractions"
  | "decimals"
  | "percentages";

export type PracticeItemRecord = {
  id: string;
  topic: PracticeTopic;
  label: string;
  prompt: string;
  answer: string;
  selected: string;
  correct: boolean;
  attempts: number;
};

export type DailyPracticeRecord = {
  id: string;
  date: string;
  completedAt: string;
  topic: PracticeTopic;
  lessonTitle: string;
  total: number;
  correct: number;
  firstTryCorrect: number;
  needsReview: PracticeTopic[];
  items: PracticeItemRecord[];
};

export type TopicSummary = {
  topic: PracticeTopic;
  practised: number;
  missed: number;
  firstTryCorrect: number;
};

export const DAILY_PROGRESS_KEY = "haim-daily-practice-progress-v3";
export const LEGACY_DAILY_PROGRESS_KEY = "haim-daily-practice-progress-v2";

export const topicLabels: Record<PracticeTopic, string> = {
  multiplication: "Multiplication & division",
  fractions: "Fractions",
  decimals: "Decimals",
  percentages: "Percentages",
};

export function summarizeTopics(records: DailyPracticeRecord[]) {
  const summaries = new Map<PracticeTopic, TopicSummary>();
  for (const record of records) {
    for (const item of record.items) {
      const summary = summaries.get(item.topic) ?? {
        topic: item.topic,
        practised: 0,
        missed: 0,
        firstTryCorrect: 0,
      };
      summary.practised += 1;
      if (!item.correct) summary.missed += 1;
      if (item.correct && item.attempts <= 1) summary.firstTryCorrect += 1;
      summaries.set(item.topic, summary);
    }
  }
  return [...summaries.values()].sort(
    (left, right) =>
      right.missed - left.missed || right.practised - left.practised,
  );
}

export function recommendedFocus(records: DailyPracticeRecord[]) {
  const topic = summarizeTopics(records).find((summary) => summary.missed > 0);
  return topic?.topic ?? records[0]?.topic ?? "multiplication";
}

export function practiceSupportNote(topic: PracticeTopic) {
  const notes: Record<PracticeTopic, string> = {
    multiplication:
      "Ask Haim to say the full fact family aloud, then solve one related story problem slowly.",
    fractions:
      "Draw a same-length bar first. Ask what the whole is, then use the denominator before the numerator.",
    decimals:
      "Line up the decimal points and ask Haim to read each number with place-value words.",
    percentages:
      "Ask percent of what whole, then use friendly benchmarks such as 50%, 25%, 10%, and 5%.",
  };
  return notes[topic];
}

export function isPracticeRecord(value: unknown): value is DailyPracticeRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<DailyPracticeRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.date === "string" &&
    typeof record.completedAt === "string" &&
    typeof record.topic === "string" &&
    Array.isArray(record.items)
  );
}
