import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  AppShell,
  Card,
  PageHeader,
  Pill,
} from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function ParentReportPage() {
  const { reports, recommendations, student, evidenceEvents } =
    await getMvpState();
  const report = reports[0];
  const recommendation = recommendations[0];
  const retentionStatus =
    (report?.retentionStatus as
      | {
          latestDailyPractice?: {
            practiceDate?: string;
            summary?: string | null;
            completedAt?: string | Date | null;
          } | null;
          suggestedHomeSupport?: string;
        }
      | undefined) ?? null;
  const dailyEvents = evidenceEvents.filter(
    (event) => event.eventType === "Daily Practice",
  );
  const recentDailyEvents = dailyEvents.slice(0, 35);
  const topicCounts = new Map<string, number>();
  const mistakeCounts = new Map<string, number>();

  for (const event of recentDailyEvents) {
    topicCounts.set(
      event.skill.microSkill,
      (topicCounts.get(event.skill.microSkill) ?? 0) + 1,
    );
    if (event.correctness < 100)
      mistakeCounts.set(
        event.skill.microSkill,
        (mistakeCounts.get(event.skill.microSkill) ?? 0) + 1,
      );
  }

  const topicsPractised = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const recurringMistakes = [...mistakeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const correctRecent = recentDailyEvents.filter(
    (event) => event.correctness === 100,
  ).length;
  const recentAccuracy = recentDailyEvents.length
    ? Math.round((correctRecent / recentDailyEvents.length) * 100)
    : null;
  const topMistake = recurringMistakes[0]?.[0];
  const recommendedSupport = topMistake
    ? `Spend 5–10 minutes on ${topMistake}. Ask Haim to explain one worked example aloud, then solve one similar problem slowly.`
    : (retentionStatus?.suggestedHomeSupport ??
      report?.recommendedHomeSupport ??
      recommendation?.parentFriendlyRationale ??
      "Keep the routine light: one short tutor session a day is enough.");

  return (
    <AppShell active="/parent-report" mode="simple">
      <PageHeader eyebrow="Parent Report" title="Simple parent summary">
        <p>
          Use this during the pilot to see what Haim practised, recurring
          mistakes, and one practical way to support her at home. Internal
          evidence, mastery, retention, and item-bank details stay in owner
          tools.
        </p>
      </PageHeader>

      <Card className="bg-[#fffaf2]">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm text-[#64716c]">Student</p>
            <h3 className="text-2xl font-semibold">{student.name}</h3>
          </div>
          <Pill tone="ink">Year 6 Maths</Pill>
        </div>
        <p className="mt-5 text-xl leading-8 text-[#263632]">
          {recentDailyEvents.length
            ? `Recent daily tutor work: ${correctRecent}/${recentDailyEvents.length} questions correct${recentAccuracy === null ? "" : ` (${recentAccuracy}%)`}. Treat this as a learning signal, not a grade.`
            : (report?.summary ??
              "No daily tutor session has been completed yet. Once Haim finishes a session, this page will show a practical parent summary.")}
        </p>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-lg font-semibold">Topics practised</h3>
          {topicsPractised.length ? (
            <ul className="space-y-2">
              {topicsPractised.map(([topic, count]) => (
                <li
                  key={topic}
                  className="rounded-2xl bg-[#f7fbf7] p-3 text-sm"
                >
                  <span className="font-semibold">{topic}</span>
                  <br />
                  {count} recent question{count === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#64716c]">No daily tutor data yet.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold">Recurring mistakes</h3>
          {recurringMistakes.length ? (
            <ul className="space-y-2">
              {recurringMistakes.map(([topic, count]) => (
                <li
                  key={topic}
                  className="rounded-2xl bg-[#fff3dd] p-3 text-sm"
                >
                  <span className="font-semibold">{topic}</span>
                  <br />
                  Missed {count} time{count === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#64716c]">
              No repeated missed topic from recent daily practice.
            </p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold">Recommended support</h3>
          <p className="leading-7 text-[#53615c]">{recommendedSupport}</p>
        </Card>
      </div>

      <Card className="mt-5 border-[#caa05f] bg-[#fff7e8]">
        <h3 className="mb-3 text-lg font-semibold">
          Latest daily tutor session
        </h3>
        {retentionStatus?.latestDailyPractice ? (
          <div>
            <p className="text-sm text-[#64716c]">
              Latest completed practice:{" "}
              {retentionStatus.latestDailyPractice.practiceDate}
            </p>
            <p className="mt-2 text-xl leading-8 text-[#263632]">
              {retentionStatus.latestDailyPractice.summary ??
                "Daily tutor work was completed and saved."}
            </p>
          </div>
        ) : (
          <p className="text-[#64716c]">
            No daily tutor session has been completed yet. Start from Home to
            generate the first short tutor session.
          </p>
        )}
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Link
          href="/"
          className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5"
        >
          Back to Haim’s home <ArrowRight className="mt-3 size-5" />
        </Link>
        <Link
          href="/today"
          className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold text-[#10211f] shadow-sm transition hover:-translate-y-0.5"
        >
          Open today’s review <ArrowRight className="mt-3 size-5" />
        </Link>
      </div>
    </AppShell>
  );
}
