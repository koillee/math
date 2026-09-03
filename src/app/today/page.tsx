import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Sparkles,
} from "lucide-react";
import { ExtraPracticeButton } from "../ExtraPracticeButton";
import {
  AppShell,
  Card,
  PageHeader,
  Pill,
} from "@/components/masteryos/chrome";
import {
  getPracticeSessionState,
  getTodaysPracticeState,
} from "@/lib/learning/todays-practice";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const justCompleted = params.completed === "1";
  const requestedSessionId =
    typeof params.sessionId === "string" ? params.sessionId : undefined;
  const state = requestedSessionId
    ? await getPracticeSessionState(requestedSessionId)
    : await getTodaysPracticeState();
  if (!state) return null;
  const completed = state.completedEvidence;

  return (
    <AppShell active="/today" mode="simple">
      <div
        className="sr-only"
        data-session-id={state.session.id}
        data-practice-date={state.practiceDate}
        data-item-ids={state.items.map((item) => item.itemId).join(",")}
      />
      <PageHeader
        eyebrow="Today’s Tutor"
        title={
          state.isCompleted
            ? "Today’s tutor review"
            : "Start today’s short maths tutor"
        }
      >
        <p>
          This page is now the review and parent note for the daily tutor.
          Haim’s normal path is Home → mini lesson → five questions → review.
        </p>
      </PageHeader>

      {justCompleted ? (
        <div className="mb-5 rounded-[1.5rem] border border-[#cfe0c5] bg-[#edf7e8] p-4 font-semibold text-[#244d32]">
          Today’s practice saved. The parent summary and answer review are
          ready.
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <p className="text-sm text-[#64716c]">Date</p>
          <h3 className="mt-2 text-2xl font-semibold">{state.practiceDate}</h3>
          <p className="text-sm text-[#64716c]">one stable set for today</p>
        </Card>
        <Card>
          <p className="text-sm text-[#64716c]">Status</p>
          <h3 className="mt-2 text-2xl font-semibold">{state.statusLabel}</h3>
          <p className="text-sm text-[#64716c]">refresh keeps this same set</p>
        </Card>
        <Card>
          <p className="text-sm text-[#64716c]">Topic</p>
          <h3 className="mt-2 text-2xl font-semibold">
            {state.tutorTopic.shortTitle}
          </h3>
          <p className="text-sm text-[#64716c]">
            {state.items.length} tutor questions
          </p>
        </Card>
      </div>

      {state.isCompleted ? (
        <div className="mt-5 space-y-5">
          <Card className="bg-[#10211f] text-[#f8efe1]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#d99b4a]" />
              <Pill tone="amber">Completed today</Pill>
            </div>
            <h3 className="mt-4 font-serif text-4xl font-semibold">
              Today’s practice is complete
            </h3>
            <p className="mt-4 max-w-3xl text-lg text-[#d8cdbb]">
              {state.session.summary ??
                "The practice set has been submitted and saved to the learning profile."}
            </p>
            {completed ? (
              <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-[#e8ddca]">
                Score: {completed.correctCount}/{completed.totalCount} correct.
                Skills practised:{" "}
                {completed.skillsPractised.join(" · ") ||
                  "today’s selected skills"}
                .
              </p>
            ) : null}
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <BookOpenCheck className="size-5 text-[#2f6173]" /> Parent summary
            </h3>
            {completed?.parentSummary ? (
              <div className="space-y-4">
                <p className="text-2xl font-semibold text-[#10211f]">
                  {completed.parentSummary.headline}
                </p>
                <p className="leading-7 text-[#53615c]">
                  Topic practised:{" "}
                  <span className="font-semibold text-[#10211f]">
                    {completed.parentSummary.topic}
                  </span>
                  . {state.tutorTopic.parentFocus}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#edf7e8] p-4">
                    <p className="font-semibold text-[#244d32]">
                      What went well
                    </p>
                    {completed.parentSummary.strengths.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-[#36582e]">
                        {completed.parentSummary.strengths.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#36582e]">
                        Effort and completion were recorded today.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-[#fff3dd] p-4">
                    <p className="font-semibold text-[#754714]">
                      What to review
                    </p>
                    {completed.parentSummary.focusAreas.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-[#754714]">
                        {completed.parentSummary.focusAreas.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#754714]">
                        No missed questions in this set.
                      </p>
                    )}
                  </div>
                </div>
                <p className="rounded-2xl bg-[#f7fbf7] p-4 text-sm leading-6 text-[#53615c]">
                  <span className="font-semibold text-[#10211f]">
                    Suggested support:
                  </span>{" "}
                  {completed.parentSummary.recommendedSupport}
                </p>
              </div>
            ) : (
              <p className="text-[#64716c]">
                Parent summary will appear after today’s tutor session is
                submitted.
              </p>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-[#b77525]" /> What we learned
              today
            </h3>
            <ul className="space-y-2 text-sm leading-6 text-[#53615c]">
              {(
                completed?.learnedToday ?? [
                  "The app saved today’s evidence and refreshed the learning profile.",
                ]
              ).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-semibold">
                  <Sparkles className="size-5 text-[#b77525]" /> Review your
                  answers
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#53615c]">
                  Look at each answer, notice what worked, and use the review
                  note to choose what to practise next.
                </p>
              </div>
              <Pill tone="blue">
                {completed?.review.length ?? 0} of {state.items.length} reviewed
              </Pill>
            </div>
            <div className="mt-5 space-y-4">
              {completed?.review.length ? (
                completed.review.map((review) => (
                  <article
                    key={review.itemId}
                    className={`rounded-[1.5rem] border p-5 ${review.isCorrect ? "border-[#cfe0c5] bg-[#f4faef]" : "border-[#e5c895] bg-[#fff8e9]"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {review.isCorrect ? (
                          <CircleCheck className="mt-1 size-5 shrink-0 text-[#3f7b45]" />
                        ) : (
                          <CircleAlert className="mt-1 size-5 shrink-0 text-[#a46122]" />
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94652e]">
                            Problem {review.position}
                          </p>
                          <h4 className="mt-1 text-xl font-semibold">
                            {review.title}
                          </h4>
                        </div>
                      </div>
                      <Pill tone={review.isCorrect ? "green" : "amber"}>
                        {review.isCorrect ? "Correct" : "Review this answer"}
                      </Pill>
                    </div>
                    <p className="mt-4 rounded-2xl bg-white/65 p-4 text-sm leading-6 text-[#263632]">
                      <span className="font-semibold">Question:</span>{" "}
                      {review.prompt}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-black/5 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64716c]">
                          Haim’s answer
                        </p>
                        <p className="mt-2 font-semibold">{review.answer}</p>
                      </div>
                      <div className="rounded-2xl border border-black/5 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64716c]">
                          Expected answer
                        </p>
                        <p className="mt-2 font-semibold">
                          {review.expectedAnswer}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#53615c]">
                      <span className="font-semibold text-[#10211f]">
                        Review note:
                      </span>{" "}
                      {review.feedback}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#53615c]">
                      <span className="font-semibold text-[#10211f]">
                        Her explanation:
                      </span>{" "}
                      {review.explanation}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-[#f6f0e5] p-4 text-sm text-[#64716c]">
                  Detailed answer review is not available for this practice yet.
                </p>
              )}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <ExtraPracticeButton />
            <Link
              href="/parent-report"
              className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5"
            >
              Open parent summary <ArrowRight className="mt-3 size-5" />
            </Link>
            <Link
              href="/owner"
              className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5"
            >
              Owner tools <ArrowRight className="mt-3 size-5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <Card className="bg-[#10211f] text-[#f8efe1]">
            <div className="flex items-center gap-3">
              <BookOpenCheck className="text-[#d99b4a]" />
              <Pill tone="amber">Today’s tutor</Pill>
            </div>
            <h3 className="mt-4 font-serif text-4xl font-semibold">
              {state.tutorTopic.title}
            </h3>
            <p className="mt-4 max-w-3xl text-lg text-[#d8cdbb]">
              {state.tutorTopic.schoolLink} Start with the mini lesson, then
              answer five multiple-choice questions.
            </p>
            <Link
              href={`/practice?sessionId=${state.session.id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-6 py-3 font-semibold text-[#10211f]"
            >
              Start today’s tutor <ArrowRight className="size-4" />
            </Link>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
