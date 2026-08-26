import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, CircleAlert, CircleCheck, Clock3, Sparkles } from "lucide-react";
import { TodayPracticeForm } from "./TodayPracticeForm";
import { ExtraPracticeButton } from "../ExtraPracticeButton";
import { AppShell, Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getPracticeSessionState, getTodaysPracticeState } from "@/lib/learning/todays-practice";

export const dynamic = "force-dynamic";

function sourceTone(sourceType: string) {
  if (sourceType === "Current Recommendation") return "amber" as const;
  if (sourceType === "Retention Queue") return "green" as const;
  if (sourceType === "Misconception Repair") return "red" as const;
  if (sourceType === "Transfer") return "blue" as const;
  return "ink" as const;
}

export default async function TodayPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const justCompleted = params.completed === "1";
  const requestedSessionId = typeof params.sessionId === "string" ? params.sessionId : undefined;
  const state = requestedSessionId ? await getPracticeSessionState(requestedSessionId) : await getTodaysPracticeState();
  if (!state) return null;
  const completed = state.completedEvidence;

  return (
    <AppShell active="/today">
      <PageHeader eyebrow="Today’s Practice" title="Start today’s short maths practice">
        <p>
          This is today’s short Year 6 maths practice. It is chosen from Haim’s current learning profile and the item bank. Keep it short, answer on screen, then stop or review the summary.
        </p>
      </PageHeader>

      {justCompleted ? <div className="mb-5 rounded-[1.5rem] border border-[#cfe0c5] bg-[#edf7e8] p-4 font-semibold text-[#244d32]">Today’s practice saved. Mastery, recommendation, parent report, evidence log, and timeline have been refreshed.</div> : null}

      <div className="grid gap-5 md:grid-cols-3">
        <Card><p className="text-sm text-[#64716c]">Date</p><h3 className="mt-2 text-2xl font-semibold">{state.practiceDate}</h3><p className="text-sm text-[#64716c]">one stable set for today</p></Card>
        <Card><p className="text-sm text-[#64716c]">Status</p><h3 className="mt-2 text-2xl font-semibold">{state.statusLabel}</h3><p className="text-sm text-[#64716c]">refresh keeps this same set</p></Card>
        <Card><p className="text-sm text-[#64716c]">Problems</p><h3 className="mt-2 text-3xl font-semibold">{state.items.length}</h3><p className="text-sm text-[#64716c]">from active Year 6 maths items</p></Card>
      </div>

      {state.isCompleted ? (
        <div className="mt-5 space-y-5">
          <Card className="bg-[#10211f] text-[#f8efe1]">
            <div className="flex items-center gap-3"><CheckCircle2 className="text-[#d99b4a]" /><Pill tone="amber">Completed today</Pill></div>
            <h3 className="mt-4 font-serif text-4xl font-semibold">Today’s practice is complete</h3>
            <p className="mt-4 max-w-3xl text-lg text-[#d8cdbb]">{state.session.summary ?? "The practice set has been submitted and saved to the learning profile."}</p>
            {completed ? <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-[#e8ddca]">Score: {completed.correctCount}/{completed.totalCount} correct. Skills practised: {completed.skillsPractised.join(" · ") || "today’s selected skills"}.</p> : null}
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-[#b77525]" /> What we learned today</h3>
            <ul className="space-y-2 text-sm leading-6 text-[#53615c]">
              {(completed?.learnedToday ?? ["The app saved today’s evidence and refreshed the learning profile."]).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-semibold"><Sparkles className="size-5 text-[#b77525]" /> Review your answers</h3>
                <p className="mt-2 text-sm leading-6 text-[#53615c]">Look at each answer, notice what worked, and use the review note to choose what to practise next.</p>
              </div>
              <Pill tone="blue">{completed?.review.length ?? 0} of {state.items.length} reviewed</Pill>
            </div>
            <div className="mt-5 space-y-4">
              {completed?.review.length ? completed.review.map((review) => (
                <article key={review.itemId} className={`rounded-[1.5rem] border p-5 ${review.isCorrect ? "border-[#cfe0c5] bg-[#f4faef]" : "border-[#e5c895] bg-[#fff8e9]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {review.isCorrect ? <CircleCheck className="mt-1 size-5 shrink-0 text-[#3f7b45]" /> : <CircleAlert className="mt-1 size-5 shrink-0 text-[#a46122]" />}
                      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94652e]">Problem {review.position}</p><h4 className="mt-1 text-xl font-semibold">{review.title}</h4></div>
                    </div>
                    <Pill tone={review.isCorrect ? "green" : "amber"}>{review.isCorrect ? "Correct" : "Review this answer"}</Pill>
                  </div>
                  <p className="mt-4 rounded-2xl bg-white/65 p-4 text-sm leading-6 text-[#263632]"><span className="font-semibold">Question:</span> {review.prompt}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-black/5 bg-white/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#64716c]">Haim’s answer</p><p className="mt-2 font-semibold">{review.answer}</p></div>
                    <div className="rounded-2xl border border-black/5 bg-white/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#64716c]">Expected answer</p><p className="mt-2 font-semibold">{review.expectedAnswer}</p></div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#53615c]"><span className="font-semibold text-[#10211f]">Review note:</span> {review.feedback}</p>
                  <p className="mt-3 text-sm leading-6 text-[#53615c]"><span className="font-semibold text-[#10211f]">Her explanation:</span> {review.explanation}</p>
                </article>
              )) : <p className="rounded-2xl bg-[#f6f0e5] p-4 text-sm text-[#64716c]">Detailed answer review is not available for this practice yet.</p>}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <ExtraPracticeButton />
            <Link href="/timeline" className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5">View timeline <ArrowRight className="mt-3 size-5" /></Link>
            <Link href="/retention" className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5">View retention queue <ArrowRight className="mt-3 size-5" /></Link>
            <Link href="/next" className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5">Do one next activity <ArrowRight className="mt-3 size-5" /></Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <Card className="bg-[#10211f] text-[#f8efe1]">
            <div className="flex items-center gap-3"><CalendarCheck className="text-[#d99b4a]" /><Pill tone="amber">Do these first</Pill></div>
            <h3 className="mt-4 font-serif text-4xl font-semibold">Five problems for today</h3>
            <p className="mt-4 max-w-3xl text-lg text-[#d8cdbb]">These were chosen because they match the current recommendation, review needs, and available Year 6 maths item-bank coverage.</p>
          </Card>

          <Card className="border-[#cfded7] bg-[#f7fbf7]">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Clock3 className="size-5 text-[#2f6173]" /> Today’s selected set</h3>
            <div className="grid gap-3 md:grid-cols-5">
              {state.items.map((practiceItem) => <div key={practiceItem.id} className="rounded-2xl bg-white/70 p-3 text-sm"><Pill tone={sourceTone(practiceItem.sourceType)}>{practiceItem.sourceType}</Pill><p className="mt-2 font-medium">{practiceItem.item.title}</p></div>)}
            </div>
          </Card>

          <TodayPracticeForm session={state.session} items={state.items} />
        </div>
      )}
    </AppShell>
  );
}
