import {
  type LessonRecap,
  type Question,
  type Template,
  estimateQuestionDifficulty,
  inferredPracticeLabels,
  rotateTemplates,
  spreadPick,
  templates,
  topicLessons,
  validateQuestion,
} from "./daily-bank";
import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
  LEGACY_DAILY_PROGRESS_KEY,
  type PracticeItemRecord,
  type PracticeSkillId,
  type PracticeTopic,
  isConfidenceFlag,
  skillDefinitions,
  skillIdForLabel,
} from "./practice-progress";

const PLAN_VERSION = 1;
export const DAILY_PLAN_KEY = "haim-daily-plans-v1";
const topics: PracticeTopic[] = [
  "multiplication",
  "fractions",
  "decimals",
  "percentages",
];

export type DailyPlan = {
  version: number;
  date: string;
  round: number;
  todayTopic: PracticeTopic;
  lesson: LessonRecap;
  questions: Question[];
  focusSkillId?: PracticeSkillId;
  reviewSkillIds: PracticeSkillId[];
};

export function practiceDate(now = new Date(), offset = 0) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  const date = new Date(
    `${value("year")}-${value("month")}-${value("day")}T00:00:00Z`,
  );
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function needsPracticeReview(item: PracticeItemRecord) {
  return !item.correct || item.attempts > 1 || isConfidenceFlag(item.feedback);
}

function orderedHistory(records: DailyPracticeRecord[], date: string) {
  return records
    .filter((record) => record.date <= date)
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 20);
}

export function reviewPriorities(records: DailyPracticeRecord[], date: string) {
  const evidence = new Map<PracticeSkillId, PracticeItemRecord[]>();
  for (const record of orderedHistory(records, date)) {
    for (const item of record.items) {
      const skill = item.skillId ?? skillIdForLabel(item.label);
      if (!skill || !skillDefinitions[skill]) continue;
      const entries = evidence.get(skill) ?? [];
      if (entries.length < 4) entries.push(item);
      evidence.set(skill, entries);
    }
  }
  return Array.from(evidence, ([skillId, items]) => {
    // Two recent independent successes retire older difficulty signals.
    if (
      items.length >= 2 &&
      items.slice(0, 2).every((item) => !needsPracticeReview(item))
    ) {
      return { skillId, score: 0 };
    }
    const score = items.reduce((sum, item, index) => {
      const weight = !item.correct
        ? 4
        : isConfidenceFlag(item.feedback)
          ? 3
          : item.attempts > 1
            ? 2
            : -2;
      return sum + weight / (index + 1);
    }, 0);
    return { skillId, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.skillId.localeCompare(b.skillId));
}

export function buildDailyPlan(
  date: string,
  records: DailyPracticeRecord[],
  round = 0,
): DailyPlan {
  const history = orderedHistory(records, date);
  const seed = Number(date.replaceAll("-", "")) + round * 97;
  const priorities = reviewPriorities(history, date);
  const focusSkillId = priorities[0]?.skillId;
  const todayTopic = focusSkillId
    ? skillDefinitions[focusSkillId].topic
    : topics[seed % topics.length];
  const topicTemplates = templates.filter(
    (template) => template.topic === todayTopic,
  );
  const focusTemplates = topicTemplates.filter(
    (template) => skillIdForLabel(template.label) === focusSkillId,
  );
  const matchingLessons = topicLessons[todayTopic].recaps.filter((lesson) =>
    focusTemplates.some((template) =>
      inferredPracticeLabels(todayTopic, lesson).includes(template.label),
    ),
  );
  const primaryLessons = matchingLessons.filter((candidate) =>
    focusTemplates.some(
      (template) =>
        (candidate.practiceLabels ??
          inferredPracticeLabels(todayTopic, candidate))[0] === template.label,
    ),
  );
  const lesson = spreadPick(
    primaryLessons.length
      ? primaryLessons
      : matchingLessons.length
        ? matchingLessons
        : topicLessons[todayTopic].recaps,
    seed,
    301,
  );
  const lessonLabels = new Set(inferredPracticeLabels(todayTopic, lesson));
  const chosen: Template[] = [];
  const add = (source: Template[], limit: number) => {
    for (const template of source) {
      if (chosen.length >= limit) break;
      if (!chosen.some((item) => item.label === template.label))
        chosen.push(template);
    }
  };
  add(rotateTemplates(focusTemplates, seed, 1), 1);
  add(
    rotateTemplates(
      topicTemplates.filter((template) => lessonLabels.has(template.label)),
      seed + 1,
      3,
    ),
    3,
  );
  add(rotateTemplates(topicTemplates, seed + 5, topicTemplates.length), 3);
  for (const priority of priorities.slice(1)) {
    add(
      templates.filter(
        (template) => skillIdForLabel(template.label) === priority.skillId,
      ),
      5,
    );
  }
  add(
    rotateTemplates(
      templates.filter((template) => template.topic !== todayTopic),
      seed + 11,
      templates.length,
    ),
    6,
  );

  const pastPrompts = new Set(
    history.flatMap((record) => record.items.map((item) => item.prompt)),
  );
  const used = new Set<string>();
  const questions = chosen.map((template, position) => {
    let fallback: Question | undefined;
    for (let attempt = 0; attempt < 128; attempt += 1) {
      const question = validateQuestion(
        template.build(seed + position * 7 + 1 + attempt * 101),
      );
      if (
        used.has(question.prompt) ||
        estimateQuestionDifficulty(question) === "Stretch"
      )
        continue;
      fallback ??= question;
      if (pastPrompts.has(question.prompt)) continue;
      used.add(question.prompt);
      return question;
    }
    if (!fallback)
      throw new Error(`No suitable daily question for ${template.label}`);
    used.add(fallback.prompt);
    return fallback;
  });
  if (questions.length !== 6)
    throw new Error("Daily plan must contain six questions");
  const reviewSkillIds = priorities
    .map((entry) => entry.skillId)
    .filter((skill) =>
      questions.some((question) => skillIdForLabel(question.label) === skill),
    );
  return {
    version: PLAN_VERSION,
    date,
    round,
    todayTopic,
    lesson,
    questions,
    focusSkillId,
    reviewSkillIds,
  };
}

export function loadPracticeHistory(): DailyPracticeRecord[] {
  try {
    const saved =
      localStorage.getItem(DAILY_PROGRESS_KEY) ??
      localStorage.getItem(LEGACY_DAILY_PROGRESS_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (record) =>
          record &&
          typeof record.date === "string" &&
          topics.includes(record.topic),
      )
      .map((record, index) => ({
        ...record,
        id:
          typeof record.id === "string"
            ? record.id
            : `legacy-${record.date}-${index}`,
        completedAt:
          typeof record.completedAt === "string"
            ? record.completedAt
            : record.date,
        lessonTitle:
          typeof record.lessonTitle === "string"
            ? record.lessonTitle
            : "Earlier daily practice",
        total: Number(record.total ?? 0),
        correct: Number(record.correct ?? 0),
        firstTryCorrect: Number(record.firstTryCorrect ?? record.correct ?? 0),
        needsReview: Array.isArray(record.needsReview)
          ? record.needsReview
          : [],
        items: Array.isArray(record.items)
          ? record.items.filter(
              (item: PracticeItemRecord) =>
                item &&
                typeof item.label === "string" &&
                typeof item.prompt === "string" &&
                typeof item.answer === "string",
            )
          : [],
      }))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 20);
  } catch {
    return [];
  }
}

type SavedPlan = { plan: DailyPlan; started: boolean; history: string };
type PlanStorage = Pick<Storage, "getItem" | "setItem">;

export function resolveDailyPlan(
  date: string,
  records: DailyPracticeRecord[],
  mode: "preview" | "start",
  round = 0,
  storage?: PlanStorage,
): DailyPlan {
  const key = `${date}:${round}`;
  const fingerprint = JSON.stringify(orderedHistory(records, date));
  let cache: Record<string, SavedPlan> = {};
  let planStorage = storage;
  try {
    planStorage ??=
      typeof window === "undefined" ? undefined : window.localStorage;
    const parsed = JSON.parse(planStorage?.getItem(DAILY_PLAN_KEY) ?? "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      cache = parsed;
    const saved = cache[key];
    if (
      saved?.plan?.version === PLAN_VERSION &&
      saved.plan.date === date &&
      saved.plan.round === round &&
      Array.isArray(saved.plan.questions) &&
      saved.plan.questions.length === 6 &&
      (saved.started || saved.history === fingerprint)
    ) {
      saved.plan.questions.forEach(validateQuestion);
      if (mode === "start") saved.started = true;
      try {
        planStorage?.setItem(DAILY_PLAN_KEY, JSON.stringify(cache));
      } catch {
        /* Keep an already-started plan stable even if storage is full. */
      }
      return saved.plan;
    }
  } catch {
    cache = {};
  }
  const plan = buildDailyPlan(date, records, round);
  cache[key] = { plan, started: mode === "start", history: fingerprint };
  const recent = Object.fromEntries(
    Object.entries(cache)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12),
  );
  try {
    planStorage?.setItem(DAILY_PLAN_KEY, JSON.stringify(recent));
  } catch {
    /* Practice can continue without storage. */
  }
  return plan;
}
