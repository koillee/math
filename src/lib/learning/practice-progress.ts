export type PracticeTopic =
  | "multiplication"
  | "fractions"
  | "decimals"
  | "percentages";

export type PracticeFeedback =
  | "understand"
  | "guessed"
  | "confusing"
  | "too-hard";

export type PracticeSkillId =
  | "fact-families"
  | "equal-groups"
  | "missing-factors"
  | "division-meaning"
  | "arrays"
  | "fraction-of-amount"
  | "equivalent-fractions"
  | "simplifying-fractions"
  | "fraction-number-line"
  | "comparing-fractions"
  | "decimal-comparison"
  | "decimal-operations"
  | "decimal-place-value"
  | "powers-of-10"
  | "benchmark-percent"
  | "percent-conversion"
  | "discounts"
  | "find-the-whole";

export type PracticeItemRecord = {
  id: string;
  topic: PracticeTopic;
  skillId?: PracticeSkillId;
  skillName?: string;
  label: string;
  prompt: string;
  answer: string;
  selected: string;
  correct: boolean;
  attempts: number;
  difficulty?: "Warm-up" | "Core" | "Stretch";
  feedback?: PracticeFeedback;
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
  feedbackFlags: number;
};

export type SkillSummary = {
  skillId: PracticeSkillId;
  skillName: string;
  topic: PracticeTopic;
  practised: number;
  missed: number;
  firstTryCorrect: number;
  confidenceFlags: number;
};

export const DAILY_PROGRESS_KEY = "haim-daily-practice-progress-v3";
export const LEGACY_DAILY_PROGRESS_KEY = "haim-daily-practice-progress-v2";

export const topicLabels: Record<PracticeTopic, string> = {
  multiplication: "Multiplication & division",
  fractions: "Fractions",
  decimals: "Decimals",
  percentages: "Percentages",
};

export const feedbackLabels: Record<PracticeFeedback, string> = {
  understand: "I understand",
  guessed: "I guessed",
  confusing: "This was confusing",
  "too-hard": "Too hard",
};

export const skillDefinitions: Record<
  PracticeSkillId,
  {
    name: string;
    topic: PracticeTopic;
    labels: string[];
    learnFocus: string;
    parentMove: string;
  }
> = {
  "fact-families": {
    name: "Fact families",
    topic: "multiplication",
    labels: ["Fact family"],
    learnFocus:
      "Use one multiplication fact to unlock the two matching division facts.",
    parentMove: "Ask Haim to say the full fact family aloud.",
  },
  "equal-groups": {
    name: "Equal groups",
    topic: "multiplication",
    labels: ["Story problem"],
    learnFocus: "Spot repeated equal groups before choosing multiplication.",
    parentMove: "Ask what one group is and how many equal groups there are.",
  },
  "missing-factors": {
    name: "Missing factors",
    topic: "multiplication",
    labels: ["Missing number"],
    learnFocus:
      "Use division to find the hidden factor, then multiply back to check.",
    parentMove: "Ask which multiplication fact would make the total.",
  },
  "division-meaning": {
    name: "Division meaning",
    topic: "multiplication",
    labels: ["Division story"],
    learnFocus:
      "Decide whether division is finding group size or number of groups.",
    parentMove: "Ask what the answer represents in the story.",
  },
  arrays: {
    name: "Arrays",
    topic: "multiplication",
    labels: ["Array model"],
    learnFocus: "Read rows and columns as an organized multiplication model.",
    parentMove: "Ask Haim to count rows first, then columns.",
  },
  "fraction-of-amount": {
    name: "Fraction of an amount",
    topic: "fractions",
    labels: ["Fraction of an amount"],
    learnFocus:
      "Divide by the denominator first, then multiply by the numerator.",
    parentMove: "Ask what the whole is before solving.",
  },
  "equivalent-fractions": {
    name: "Equivalent fractions",
    topic: "fractions",
    labels: ["Equivalent fractions"],
    learnFocus:
      "Make equal-value fractions by multiplying numerator and denominator by the same number.",
    parentMove: "Draw two same-length bars and compare the shaded amount.",
  },
  "simplifying-fractions": {
    name: "Simplifying fractions",
    topic: "fractions",
    labels: ["Simplify fractions"],
    learnFocus: "Divide numerator and denominator by the same common factor.",
    parentMove: "Ask what number can divide both parts cleanly.",
  },
  "fraction-number-line": {
    name: "Fraction number line",
    topic: "fractions",
    labels: ["Number line"],
    learnFocus:
      "Place fractions by splitting the line from 0 to 1 into equal jumps.",
    parentMove: "Ask how many equal jumps make one whole.",
  },
  "comparing-fractions": {
    name: "Comparing fractions",
    topic: "fractions",
    labels: ["Compare fractions"],
    learnFocus:
      "Compare using same denominators, benchmark halves, or visual size.",
    parentMove:
      "Ask whether each fraction is less than, equal to, or more than half.",
  },
  "decimal-comparison": {
    name: "Decimal comparison",
    topic: "decimals",
    labels: ["Decimal comparison"],
    learnFocus:
      "Line up place values and use trailing zeros to compare fairly.",
    parentMove: "Ask Haim to read both decimals as tenths or hundredths.",
  },
  "decimal-operations": {
    name: "Decimal operations",
    topic: "decimals",
    labels: ["Decimal addition", "Decimal subtraction"],
    learnFocus:
      "Line up decimal points before adding or subtracting decimal numbers.",
    parentMove: "Ask where the decimal point should stay in the answer.",
  },
  "decimal-place-value": {
    name: "Decimal place value",
    topic: "decimals",
    labels: ["Place value"],
    learnFocus:
      "Name tenths, hundredths, and thousandths as place-value columns.",
    parentMove: "Ask Haim to read the number using place-value words.",
  },
  "powers-of-10": {
    name: "Powers of 10",
    topic: "decimals",
    labels: ["Powers of 10"],
    learnFocus:
      "Move digits through place-value columns when multiplying by 10, 100, or 1000.",
    parentMove:
      "Ask which direction the number grows and how many places it moves.",
  },
  "benchmark-percent": {
    name: "Benchmark percentages",
    topic: "percentages",
    labels: ["Benchmark percent"],
    learnFocus: "Use 50%, 25%, 10%, and 5% as friendly anchors.",
    parentMove: "Ask percent of what whole before calculating.",
  },
  "percent-conversion": {
    name: "Percent conversion",
    topic: "percentages",
    labels: ["Percent conversion"],
    learnFocus:
      "Connect percent, fraction, and decimal forms of the same amount.",
    parentMove: "Ask Haim to say the same value in two different forms.",
  },
  discounts: {
    name: "Discounts",
    topic: "percentages",
    labels: ["Discount story"],
    learnFocus:
      "Find the discount amount first, then subtract when asked for the sale price.",
    parentMove: "Ask whether the question wants amount off or final price.",
  },
  "find-the-whole": {
    name: "Find the whole",
    topic: "percentages",
    labels: ["Find the whole"],
    learnFocus: "Use the known percent part to rebuild the full 100% whole.",
    parentMove: "Ask which fraction of the whole the known amount represents.",
  },
};

const labelToSkill = new Map<string, PracticeSkillId>(
  Object.entries(skillDefinitions).flatMap(([skillId, definition]) =>
    definition.labels.map((label) => [label, skillId as PracticeSkillId]),
  ),
);

export function skillIdForLabel(label: string) {
  return labelToSkill.get(label);
}

export function skillNameForId(skillId: PracticeSkillId) {
  return skillDefinitions[skillId].name;
}

export function skillNameForLabel(label: string) {
  const skillId = skillIdForLabel(label);
  return skillId ? skillNameForId(skillId) : label;
}

export function isConfidenceFlag(feedback?: PracticeFeedback) {
  return (
    feedback === "guessed" ||
    feedback === "confusing" ||
    feedback === "too-hard"
  );
}

export function summarizeTopics(records: DailyPracticeRecord[]) {
  const summaries = new Map<PracticeTopic, TopicSummary>();
  for (const record of records) {
    for (const item of record.items) {
      const summary = summaries.get(item.topic) ?? {
        topic: item.topic,
        practised: 0,
        missed: 0,
        firstTryCorrect: 0,
        feedbackFlags: 0,
      };
      summary.practised += 1;
      if (!item.correct) summary.missed += 1;
      if (item.correct && item.attempts <= 1) summary.firstTryCorrect += 1;
      if (isConfidenceFlag(item.feedback)) summary.feedbackFlags += 1;
      summaries.set(item.topic, summary);
    }
  }
  return [...summaries.values()].sort(
    (left, right) =>
      right.missed - left.missed ||
      right.feedbackFlags - left.feedbackFlags ||
      right.practised - left.practised,
  );
}

export function summarizeSkills(records: DailyPracticeRecord[]) {
  const summaries = new Map<PracticeSkillId, SkillSummary>();
  for (const record of records) {
    for (const item of record.items) {
      const skillId = item.skillId ?? skillIdForLabel(item.label);
      if (!skillId) continue;
      const definition = skillDefinitions[skillId];
      const summary = summaries.get(skillId) ?? {
        skillId,
        skillName: definition.name,
        topic: definition.topic,
        practised: 0,
        missed: 0,
        firstTryCorrect: 0,
        confidenceFlags: 0,
      };
      summary.practised += 1;
      if (!item.correct) summary.missed += 1;
      if (item.correct && item.attempts <= 1) summary.firstTryCorrect += 1;
      if (isConfidenceFlag(item.feedback)) summary.confidenceFlags += 1;
      summaries.set(skillId, summary);
    }
  }
  return [...summaries.values()].sort(
    (left, right) =>
      right.missed - left.missed ||
      right.confidenceFlags - left.confidenceFlags ||
      right.practised - left.practised,
  );
}

export function recommendedFocus(records: DailyPracticeRecord[]) {
  const topic = summarizeTopics(records).find(
    (summary) => summary.missed > 0 || summary.feedbackFlags > 0,
  );
  return topic?.topic ?? records[0]?.topic ?? "multiplication";
}

export function recommendedSkill(records: DailyPracticeRecord[]) {
  return summarizeSkills(records).find(
    (summary) => summary.missed > 0 || summary.confidenceFlags > 0,
  );
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
