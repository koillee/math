"use client";

import { Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import {
  type DailyPlan,
  loadPracticeHistory,
  needsPracticeReview,
  practiceDate,
  resolveDailyPlan,
} from "@/lib/learning/daily-plan";
import {
  type DailyPracticeRecord,
  type PracticeItemRecord,
  type PracticeSkillId,
  type PracticeTopic,
  feedbackLabels,
  isConfidenceFlag,
  practiceSupportNote,
  recommendedFocus,
  recommendedSkill,
  skillDefinitions,
  skillIdForLabel,
  skillNameForLabel,
  summarizeSkills,
  summarizeTopics,
  topicLabels,
} from "@/lib/learning/practice-progress";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  MessageCircle,
  RefreshCw,
  SearchCheck,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  koreanFeedback,
  koreanParentMoves,
  koreanSkills,
  koreanSupportNotes,
  koreanTopics,
} from "./parent-report-ko";

type ReportLanguage = "ko" | "en";
const REPORT_LANGUAGE_KEY = "haim-parent-report-language";

type CoachingDetail = {
  say: string;
  tryTogether: string;
  makeItFun: string;
  watchFor: string;
};

const coachingDetails: Record<PracticeSkillId, CoachingDetail> = {
  "fact-families": {
    say: "One fact gives us more facts for free. If we know 6 x 7 = 42, what division facts do we also know?",
    tryTogether:
      "Write one multiplication fact, then ask Haim to write the two division facts beside it.",
    makeItFun:
      "Use taekwondo moves: one kick for the multiply fact, two quick punches for the division facts.",
    watchFor:
      "She may treat division as a separate memorized fact instead of using the multiplication family.",
  },
  "equal-groups": {
    say: "Before calculating, let's find the groups. How many groups are there, and how many are in each group?",
    tryTogether:
      "Draw 4 boxes with 6 dots in each, then write 4 x 6 underneath.",
    makeItFun:
      "Use cheer counts: 4 teams, 6 claps each, then count the total rhythm.",
    watchFor:
      "Adding the two numbers instead of recognizing repeated equal groups.",
  },
  "missing-factors": {
    say: "The total is already made. Which number times this factor gets us back to the total?",
    tryTogether: "Turn 8 x ? = 56 into 56 / 8, then multiply back to check.",
    makeItFun:
      "Call it a mystery-box fact and let Haim reveal the hidden number.",
    watchFor:
      "Guessing quickly without checking the answer in the original multiplication sentence.",
  },
  "division-meaning": {
    say: "What are we finding: how many groups, or how many in each group?",
    tryTogether:
      "Use 36 stickers and 6 bags. First share into bags, then ask what one bag gets.",
    makeItFun:
      "Use snack or craft-piece sharing stories where every group must be fair.",
    watchFor:
      "Giving a number without saying what the number means in the story.",
  },
  arrays: {
    say: "Rows first, columns second. Rows times columns gives the whole array.",
    tryTogether:
      "Draw 5 rows of 7 small squares and count by rows instead of one by one.",
    makeItFun: "Make a mini concert-seat map for a K-pop stage.",
    watchFor: "Counting only one row or mixing up rows and total.",
  },
  "fraction-of-amount": {
    say: "The denominator tells us how many equal groups to split into first.",
    tryTogether:
      "For 3/4 of 20, split 20 into 4 equal groups, then take 3 groups.",
    makeItFun:
      "Use cake, craft beads, or sticker sheets and physically circle the equal groups.",
    watchFor:
      "Mixing up the roles of numerator and denominator. Multiplying first is also valid, but finding one part first can make the meaning clearer.",
  },
  "equivalent-fractions": {
    say: "The amount stays the same. We are only cutting the same whole into more equal pieces.",
    tryTogether:
      "Draw two same-length bars and shade 1/2 on one, 2/4 on the other.",
    makeItFun:
      "Fold paper strips to show how one half can become two fourths or three sixths.",
    watchFor:
      "Thinking different-looking fractions must mean different amounts.",
  },
  "simplifying-fractions": {
    say: "Can one number divide the top and bottom cleanly?",
    tryTogether:
      "Simplify 6/8 by dividing both top and bottom by 2, then draw why 3/4 matches.",
    makeItFun: "Call it fraction tidying: same value, cleaner outfit.",
    watchFor:
      "Dividing only the numerator or changing the value by using different divisors.",
  },
  "fraction-number-line": {
    say: "The denominator tells us how many equal jumps from 0 to 1.",
    tryTogether: "Draw 0 to 1, split it into 5 equal jumps, then land on 3/5.",
    makeItFun: "Make the line into stepping stones across a gymnastics beam.",
    watchFor: "Counting the marks instead of the spaces between marks.",
  },
  "comparing-fractions": {
    say: "Let's compare size, not just digits. Is each fraction less than, equal to, or more than half?",
    tryTogether:
      "Draw same-length bars for 3/8 and 5/8, then compare the shaded parts.",
    makeItFun:
      "Use a scoreboard: less than half, exactly half, more than half.",
    watchFor:
      "Assuming the fraction with the bigger denominator is always bigger.",
  },
  "decimal-comparison": {
    say: "Let's line up place value. 0.7 can be written as 0.70 so we compare hundredths fairly.",
    tryTogether: "Compare 0.6, 0.56, and 0.65 by saying them as hundredths.",
    makeItFun: "Use money language: 0.70 is like 70 cents, 0.56 is 56 cents.",
    watchFor: "Thinking 0.56 is bigger than 0.7 because 56 is bigger than 7.",
  },
  "decimal-operations": {
    say: "The decimal points line up like a backbone. Then the columns can work properly.",
    tryTogether: "Stack 3.45 + 1.2 as 3.45 + 1.20 before adding.",
    makeItFun: "Use pretend cafe prices and let Haim total a receipt.",
    watchFor: "Writing numbers without lining up decimal points.",
  },
  "decimal-place-value": {
    say: "Read the decimal with place-value words. 0.36 is thirty-six hundredths.",
    tryTogether:
      "Write a decimal chart with ones, tenths, hundredths, and thousandths.",
    makeItFun:
      "Use a place-value elevator where digits move into different floors.",
    watchFor:
      "Reading decimals as whole-number digits without naming the place.",
  },
  "powers-of-10": {
    say: "The digits move through place-value columns. Multiplying by 100 means two moves larger.",
    tryTogether: "Move 0.48 two places to show 0.48 x 100 = 48.",
    makeItFun: "Make the digits ride a two-stop train to the left.",
    watchFor: "Adding zeros without thinking about decimal place value.",
  },
  "benchmark-percent": {
    say: "Percent of what whole? Once we know the whole, friendly percents make it easier.",
    tryTogether: "Find 10% of 80, then use it to find 30% of 80.",
    makeItFun:
      "Use a 100-square grid and color friendly chunks like 10%, 25%, and 50%.",
    watchFor: "Treating the percent number itself as the answer.",
  },
  "percent-conversion": {
    say: "Percent means out of 100. Then we can turn it into a fraction or decimal.",
    tryTogether: "Change 40% into 40/100, simplify to 2/5, then say 0.4.",
    makeItFun: "Make three matching cards: percent, fraction, decimal.",
    watchFor: "Forgetting to simplify or mixing up 0.4 and 0.04.",
  },
  discounts: {
    say: "First find the amount off. Then check whether the question asks for amount off or final price.",
    tryTogether:
      "For HK$100 with 20% off, say HK$20 off and HK$80 final price.",
    makeItFun:
      "Play shopkeeper with sale tags and let Haim choose the better deal.",
    watchFor:
      "Answering with the discount amount when the question asks what you pay.",
  },
  "find-the-whole": {
    say: "We know one percent part. Let's rebuild all the equal parts until we reach 100%.",
    tryTogether:
      "If 15 is 25%, say 25% is one quarter, so the whole is 15 x 4 = 60.",
    makeItFun:
      "Use puzzle pieces: one known piece helps rebuild the full picture.",
    watchFor:
      "Calculating before identifying what percent of the whole is known.",
  },
};

function uniqueSkillIdsFromItems(items: PracticeItemRecord[]) {
  const seen = new Set<PracticeSkillId>();
  for (const item of items) {
    const skillId = item.skillId ?? skillIdForLabel(item.label);
    if (skillId) seen.add(skillId);
  }
  return Array.from(seen);
}

function fallbackSkillForTopic(topic: PracticeTopic) {
  return Object.entries(skillDefinitions).find(
    ([, definition]) => definition.topic === topic,
  )?.[0] as PracticeSkillId | undefined;
}

export function ParentSummaryClient() {
  const [records, setRecords] = useState<DailyPracticeRecord[]>([]);
  const [language, setLanguage] = useState<ReportLanguage>("ko");
  const [tomorrowPlan, setTomorrowPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    const update = () => {
      const history = loadPracticeHistory();
      setRecords(history);
      setTomorrowPlan(
        resolveDailyPlan(practiceDate(new Date(), 1), history, "preview"),
      );
    };
    update();
    window.addEventListener("focus", update);
    window.addEventListener("storage", update);
    const timer = window.setInterval(update, 60_000);
    try {
      const savedLanguage = window.localStorage.getItem(REPORT_LANGUAGE_KEY);
      if (savedLanguage === "ko" || savedLanguage === "en") {
        setLanguage(savedLanguage);
      }
    } catch {
      // The report remains usable when browser storage is unavailable.
    }
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("storage", update);
      window.clearInterval(timer);
    };
  }, []);

  const t = (en: string, ko: string) => (language === "ko" ? ko : en);
  const topics = language === "ko" ? koreanTopics : topicLabels;
  const feedbackText = language === "ko" ? koreanFeedback : feedbackLabels;
  const skillName = (id: PracticeSkillId) =>
    language === "ko" ? koreanSkills[id].name : skillDefinitions[id].name;
  const learnFocus = (id: PracticeSkillId) =>
    language === "ko"
      ? koreanSkills[id].learnFocus
      : skillDefinitions[id].learnFocus;
  const itemSkillName = (item: PracticeItemRecord) => {
    const id = item.skillId ?? skillIdForLabel(item.label);
    return id
      ? skillName(id)
      : (item.skillName ?? skillNameForLabel(item.label));
  };
  const patternText = (
    practised: number,
    missed: number,
    first: number,
    flags: number,
  ) =>
    t(
      `Practised ${practised}, missed ${missed}, first-try correct ${first}, confidence flags ${flags}`,
      `${practised}문제 연습 · 오답 ${missed}개 · 첫 시도 정답 ${first}개 · 어려움 표시 ${flags}개`,
    );

  function changeLanguage(next: ReportLanguage) {
    setLanguage(next);
    try {
      window.localStorage.setItem(REPORT_LANGUAGE_KEY, next);
    } catch {
      // Language switching does not depend on saving the preference.
    }
  }

  const latest = records[0];
  const topicSummaries = useMemo(() => summarizeTopics(records), [records]);
  const skillSummaries = useMemo(() => summarizeSkills(records), [records]);
  const focus = useMemo(() => recommendedFocus(records), [records]);
  const skillFocus = useMemo(() => recommendedSkill(records), [records]);
  const total = records.reduce((sum, record) => sum + record.total, 0);
  const correct = records.reduce((sum, record) => sum + record.correct, 0);
  const firstTry = records.reduce(
    (sum, record) => sum + record.firstTryCorrect,
    0,
  );
  const confidenceFlags = records.reduce(
    (sum, record) =>
      sum +
      record.items.filter((item) => isConfidenceFlag(item.feedback)).length,
    0,
  );
  const reviewItems = records
    .flatMap((record) =>
      record.items
        .filter(needsPracticeReview)
        .map((item) => ({ ...item, date: record.date })),
    )
    .slice(0, 8);
  const latestReviewItems = latest?.items.filter(needsPracticeReview) ?? [];
  const reviewSkillIds = uniqueSkillIdsFromItems(reviewItems);
  const latestSkillIds = uniqueSkillIdsFromItems(
    latest?.items.filter((item) => item.topic === latest.topic) ?? [],
  );
  const fallbackSkillId = fallbackSkillForTopic(focus);
  const coachingSkillIds: PracticeSkillId[] =
    reviewSkillIds.length > 0
      ? reviewSkillIds.slice(0, 3)
      : latestSkillIds.length > 0
        ? latestSkillIds.slice(0, 3)
        : skillFocus
          ? [skillFocus.skillId]
          : fallbackSkillId
            ? [fallbackSkillId]
            : [];

  function refresh() {
    const history = loadPracticeHistory();
    setRecords(history);
    setTomorrowPlan(
      resolveDailyPlan(practiceDate(new Date(), 1), history, "preview"),
    );
  }

  return (
    <div lang={language}>
      <div className="mb-5 flex justify-end">
        <fieldset
          aria-label={t("Parent report language", "부모 리포트 언어")}
          className="inline-flex rounded-lg border border-[#d8cdbb] bg-white p-1"
        >
          {(["ko", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              lang={value}
              aria-pressed={language === value}
              onClick={() => changeLanguage(value)}
              className={`min-h-11 min-w-24 rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6173] ${language === value ? "bg-[#10211f] text-white" : "text-[#53615c] hover:bg-[#f7fbf7]"}`}
            >
              {value === "ko" ? "한국어" : "English"}
            </button>
          ))}
        </fieldset>
      </div>
      <PageHeader
        eyebrow={t("Parent Summary", "부모 리포트")}
        title={t("What to review next", "하임이와 함께하는 복습과 예습")}
      >
        <p>
          {t(
            "A practical home view based on the practice completed in this browser. It is a learning signal, not a grade.",
            "이 브라우저에서 완료한 연습을 바탕으로 집에서 도울 방법을 안내합니다. 성적표가 아닌 학습 참고 자료예요.",
          )}
        </p>
      </PageHeader>
      {!records.length ? (
        <div className="space-y-5">
          <Card className="bg-[#fffaf2]">
            <h3 className="text-2xl font-semibold">
              {t("No practice saved yet", "아직 저장된 연습이 없어요")}
            </h3>
            <p className="mt-3 leading-7 text-[#53615c]">
              {t(
                "Once Haim finishes Daily Practice on this browser, this page will show what she worked on, what felt tricky, and what to review next.",
                "하임이가 이 브라우저에서 오늘의 연습을 마치면, 학습한 내용과 어려워한 부분, 다음 복습 내용을 확인할 수 있어요.",
              )}
            </p>
            <Link
              href="/daily-practice"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
            >
              {t("Open Daily Practice", "오늘의 연습 시작하기")}
              <ArrowRight className="size-4" />
            </Link>
          </Card>
          <ParentPlanPreview plan={tomorrowPlan} language={language} />
        </div>
      ) : (
        <div className="space-y-5">
          <Card className="bg-[#fffaf2]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#64716c]">
                  {t("Recent practice", "최근 연습 요약")}
                </p>
                <h3 className="mt-1 text-3xl font-semibold">
                  {correct}/{total} {t("correct", "정답")}
                </h3>
                <p className="mt-2 leading-7 text-[#53615c]">
                  {t(
                    `First-try fluency: ${firstTry}/${total}. Haim marked ${confidenceFlags} question${confidenceFlags === 1 ? "" : "s"} as guessed, confusing, or too hard.`,
                    `첫 시도 정답: ${firstTry}/${total}. 하임이가 추측했거나, 헷갈렸거나, 너무 어렵다고 표시한 문제는 ${confidenceFlags}개예요.`,
                  )}
                </p>
              </div>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-white/80 px-4 py-2 font-semibold text-[#53615c]"
              >
                <RefreshCw className="size-4" />
                {t("Refresh", "새로고침")}
              </button>
            </div>
          </Card>

          <section className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="bg-[#10211f] text-[#f8efe1]">
              <div className="flex items-center gap-2">
                <SearchCheck className="size-5 text-[#d99b4a]" />
                <h3 className="text-xl font-semibold">
                  {t("Tonight review", "오늘의 복습")}
                </h3>
              </div>
              <p className="mt-3 leading-7 text-[#d8cdbb]">
                {t(
                  "Spend 5 minutes on one skill. Start with her thinking, then use the exact words below.",
                  "한 가지 개념만 골라 5분 정도 함께해보세요. 하임이가 어떻게 생각했는지 먼저 듣고, 아래의 말로 대화를 시작해보세요.",
                )}
              </p>
              <div className="mt-5 grid gap-3">
                {coachingSkillIds.map((skillId) => {
                  const definition = skillDefinitions[skillId];
                  const coaching =
                    language === "ko"
                      ? koreanSkills[skillId]
                      : coachingDetails[skillId];
                  return (
                    <div
                      key={skillId}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">
                          {skillName(skillId)}
                        </p>
                        <Pill tone="amber">{topics[definition.topic]}</Pill>
                      </div>
                      <p className="mt-3 leading-6 text-[#f8efe1]">
                        <span className="font-semibold text-[#d99b4a]">
                          {t("Say this: ", "이렇게 말해주세요: ")}
                        </span>
                        {coaching.say}
                      </p>
                      <p className="mt-2 leading-6 text-[#d8cdbb]">
                        <span className="font-semibold text-[#f8efe1]">
                          {t("Try together: ", "함께 해보기: ")}
                        </span>
                        {coaching.tryTogether}
                      </p>
                      <p className="mt-2 leading-6 text-[#d8cdbb]">
                        <span className="font-semibold text-[#f8efe1]">
                          {t("Make it fun: ", "재미있게 해보기: ")}
                        </span>
                        {coaching.makeItFun}
                      </p>
                      <p className="mt-2 leading-6 text-[#f2d8b0]">
                        {t("Watch for: ", "살펴볼 점: ")}
                        {coaching.watchFor}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <ParentPlanPreview plan={tomorrowPlan} language={language} />
          </section>

          {reviewItems.length > 0 ? (
            <Card>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-[#2f6173]" />
                <h3 className="text-xl font-semibold">
                  {t(
                    "Use these exact problems",
                    "실제로 풀었던 문제로 함께 복습해요",
                  )}
                </h3>
              </div>
              <div className="mt-4 grid gap-3">
                {reviewItems.slice(0, 3).map((item) => (
                  <div
                    key={`coach-${item.date}-${item.id}`}
                    className="rounded-2xl bg-[#fff8e9] p-4"
                  >
                    <p className="font-semibold">{itemSkillName(item)}</p>
                    <p lang="en" className="mt-2 leading-7 text-[#754714]">
                      {item.prompt}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#754714]">
                      {t(
                        `Ask Haim to explain the first step before choosing an answer. Then compare her reasoning with the answer: ${item.answer}.`,
                        `답을 고르기 전에 첫 단계를 설명해보게 해주세요. 그런 다음 풀이 과정을 정답과 비교해보세요. 정답: ${item.answer}.`,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-3">
            <Card>
              <div className="flex items-center gap-2">
                <BookOpenCheck className="size-5 text-[#2f6173]" />
                <h3 className="text-xl font-semibold">
                  {t("Latest session", "가장 최근 연습")}
                </h3>
              </div>
              <p className="mt-4 text-sm text-[#64716c]">{latest.date}</p>
              <p className="mt-2 text-lg font-semibold">
                {topics[latest.topic]}
              </p>
              <p className="mt-2 leading-7 text-[#53615c]">
                {t("Lesson: ", "학습 내용 (원문): ")}
                <span lang="en">{latest.lessonTitle}</span>
              </p>
              <p className="mt-2 leading-7 text-[#53615c]">
                {t(
                  `Result: ${latest.correct}/${latest.total}, with ${latest.firstTryCorrect} correct on the first try.`,
                  `정답 ${latest.correct}/${latest.total}개, 그중 ${latest.firstTryCorrect}개는 첫 시도에 맞혔어요.`,
                )}
              </p>
              {latestReviewItems.length > 0 ? (
                <p className="mt-2 leading-7 text-[#53615c]">
                  {t(
                    `Review signal: ${latestReviewItems.length} question${latestReviewItems.length === 1 ? "" : "s"} worth revisiting.`,
                    `다시 살펴보면 좋은 문제가 ${latestReviewItems.length}개 있어요.`,
                  )}
                </p>
              ) : null}
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <Target className="size-5 text-[#2f6173]" />
                <h3 className="text-xl font-semibold">
                  {t("Next focus", "다음에 도와줄 부분")}
                </h3>
              </div>
              <div className="mt-4">
                <Pill
                  tone={
                    records.some((record) => record.needsReview.length)
                      ? "amber"
                      : "green"
                  }
                >
                  {topics[focus]}
                </Pill>
              </div>
              <p className="mt-4 leading-7 text-[#53615c]">
                {language === "ko"
                  ? koreanSupportNotes[focus]
                  : practiceSupportNote(focus)}
              </p>
              {skillFocus ? (
                <div className="mt-4 rounded-2xl bg-[#fff8e9] p-4 text-sm text-[#754714]">
                  <p className="font-semibold">
                    {skillName(skillFocus.skillId)}
                  </p>
                  <p className="mt-1 leading-6">
                    {language === "ko"
                      ? koreanParentMoves[skillFocus.skillId]
                      : skillDefinitions[skillFocus.skillId].parentMove}
                  </p>
                </div>
              ) : null}
            </Card>

            <Card>
              <h3 className="text-xl font-semibold">
                {t("Topic pattern", "영역별 연습 현황")}
              </h3>
              <div className="mt-4 space-y-3">
                {topicSummaries.slice(0, 4).map((summary) => (
                  <div
                    key={summary.topic}
                    className="rounded-2xl bg-[#f7fbf7] p-3"
                  >
                    <p className="font-semibold">{topics[summary.topic]}</p>
                    <p className="mt-1 text-sm text-[#53615c]">
                      {patternText(
                        summary.practised,
                        summary.missed,
                        summary.firstTryCorrect,
                        summary.feedbackFlags,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-xl font-semibold">
              {t("Skill pattern", "개념별 연습 현황")}
            </h3>
            {skillSummaries.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {skillSummaries.slice(0, 6).map((summary) => (
                  <div
                    key={summary.skillId}
                    className="rounded-2xl bg-[#f7fbf7] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {skillName(summary.skillId)}
                      </p>
                      <span className="text-sm text-[#64716c]">
                        {topics[summary.topic]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#53615c]">
                      {patternText(
                        summary.practised,
                        summary.missed,
                        summary.firstTryCorrect,
                        summary.confidenceFlags,
                      )}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#53615c]">
                      {learnFocus(summary.skillId)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 leading-7 text-[#53615c]">
                {t(
                  "Newer practice sessions will show skill-level patterns here.",
                  "새로 연습을 완료하면 개념별 현황이 여기에 표시돼요.",
                )}
              </p>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-semibold">
              {t("Questions to revisit", "다시 풀어볼 문제")}
            </h3>
            <p className="mt-2 text-sm text-[#53615c]">
              {t(
                "Questions and saved lesson titles are shown as Haim saw them.",
                "문제와 저장된 수업 제목은 하임이가 본 영어 원문으로 표시해요.",
              )}
            </p>
            {reviewItems.length ? (
              <div className="mt-4 grid gap-3">
                {reviewItems.map((item) => (
                  <div
                    key={`${item.date}-${item.id}`}
                    className="rounded-2xl bg-[#fff3dd] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{itemSkillName(item)}</p>
                      <span className="text-sm text-[#754714]">
                        {item.date}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#754714]">
                      {topics[item.topic]} ·{" "}
                      {t(
                        item.difficulty ?? "Practice",
                        item.difficulty === "Warm-up"
                          ? "준비 연습"
                          : item.difficulty === "Core"
                            ? "기본"
                            : item.difficulty === "Stretch"
                              ? "도전"
                              : "연습",
                      )}
                      {item.feedback
                        ? ` · ${t("Haim said", "하임이의 느낌")}: ${feedbackText[item.feedback]}`
                        : ""}
                    </p>
                    <p lang="en" className="mt-2 leading-7 text-[#754714]">
                      {item.prompt}
                    </p>
                    <p className="mt-2 text-sm text-[#754714]">
                      {t(
                        `Haim chose ${item.selected || "no answer"}; answer: ${item.answer}.`,
                        `하임이의 답: ${item.selected || "응답 없음"} · 정답: ${item.answer}`,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 leading-7 text-[#53615c]">
                {t(
                  "No missed or uncertain answers saved in recent practice. Keep the daily session short and confident.",
                  "최근 연습에서 틀리거나 어렵다고 표시한 문제가 없어요. 짧은 연습으로 자신감을 이어가세요.",
                )}
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function ParentPlanPreview({
  plan,
  language,
}: { plan: DailyPlan | null; language: ReportLanguage }) {
  const t = (en: string, ko: string) => (language === "ko" ? ko : en);
  if (!plan)
    return (
      <output>
        {t("Preparing tomorrow's plan...", "내일 학습을 준비하고 있어요...")}
      </output>
    );
  const topics = language === "ko" ? koreanTopics : topicLabels;
  const skills = Array.from(
    new Set(
      plan.questions
        .slice(0, 3)
        .map((question) => skillIdForLabel(question.label)),
    ),
  )
    .filter((id): id is PracticeSkillId => Boolean(id))
    .slice(0, 2);
  return (
    <Card className="bg-[#f7fbf7]">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-5 shrink-0 text-[#2f6173]" />
        <h3 className="text-xl font-semibold">
          {t("Tomorrow preview", "내일을 위한 예습")}
        </h3>
      </div>
      <p className="mt-3 text-sm text-[#53615c]">
        {plan.date} · {topics[plan.todayTopic]}
      </p>
      <p className="mt-2 leading-7 text-[#53615c]">
        {plan.focusSkillId
          ? t(
              `Recent practice suggests another look at ${skillDefinitions[plan.focusSkillId].name}.`,
              `최근 연습을 바탕으로 '${koreanSkills[plan.focusSkillId].name}'을 다시 살펴보도록 준비했어요.`,
            )
          : t(
              "A new lesson with mixed practice.",
              "새로운 수업과 여러 개념을 섞은 연습을 준비했어요.",
            )}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#53615c]">
        {t(
          "This is tomorrow's first practice set in this browser. More practice before it starts may update the plan. Keep preparation light; answers are for parents.",
          "이 브라우저에서 내일 처음 시작할 수업과 문제예요. 시작 전 추가 연습을 하면 계획이 갱신될 수 있어요. 예습은 가볍게, 정답은 부모님 참고용으로 봐주세요.",
        )}
      </p>
      <div lang="en" className="mt-5 space-y-3 border-t border-[#cfded7] pt-4">
        <h4 className="text-lg font-semibold">{plan.lesson.title}</h4>
        <p className="leading-7 text-[#41504b]">{plan.lesson.bigIdea}</p>
        <ol className="list-decimal space-y-2 pl-5 text-[#53615c]">
          {plan.lesson.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="leading-7 text-[#41504b]">{plan.lesson.example}</p>
        <p className="text-sm leading-6 text-[#754714]">{plan.lesson.trap}</p>
      </div>
      <div className="mt-5 space-y-4 border-t border-[#cfded7] pt-4">
        {skills.map((id) => {
          const coaching =
            language === "ko" ? koreanSkills[id] : coachingDetails[id];
          return (
            <div key={id}>
              <h4 className="font-semibold">
                {language === "ko"
                  ? koreanSkills[id].name
                  : skillDefinitions[id].name}
              </h4>
              <p className="mt-2 leading-6 text-[#41504b]">
                {t("Say this: ", "이렇게 말해주세요: ")}
                {coaching.say}
              </p>
              <p className="mt-2 leading-6 text-[#53615c]">
                {t("Try together: ", "함께 해보기: ")}
                {coaching.tryTogether}
              </p>
            </div>
          );
        })}
      </div>
      <details className="mt-5 border-t border-[#cfded7] pt-4">
        <summary className="cursor-pointer font-semibold">
          {t("Tomorrow's 6 questions", "내일의 실제 6문제")}
        </summary>
        <ol className="mt-4 list-decimal space-y-5 pl-5">
          {plan.questions.map((question) => (
            <li key={question.id}>
              <p lang="en" className="leading-7">
                {question.prompt}
              </p>
              <p lang="en" className="mt-1 text-sm text-[#53615c]">
                {question.choices.join(" · ")}
              </p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-[#2f6173]">
                  {t("Answer and explanation", "정답과 해설")}
                </summary>
                <p className="mt-2 font-semibold">{question.answer}</p>
                <p lang="en" className="mt-1 leading-6 text-[#53615c]">
                  {question.explanation}
                </p>
              </details>
            </li>
          ))}
        </ol>
      </details>
    </Card>
  );
}
