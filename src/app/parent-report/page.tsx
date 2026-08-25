import { AppShell, Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function ParentReportPage() {
  const { reports, recommendations, student } = await getMvpState();
  const report = reports[0];
  const recommendation = recommendations[0];
  const strengths = (report?.strengths as string[] | undefined) ?? [];
  const focusAreas = (report?.focusAreas as string[] | undefined) ?? [];
  const misconceptionNotes = (report?.misconceptionNotes as string[] | undefined) ?? [];
  const retentionStatus = (report?.retentionStatus as {
    summary?: string;
    dueNowCount?: number;
    dueSoonCount?: number;
    stableCount?: number;
    needsMoreEvidenceCount?: number;
    topReviewSkill?: string | null;
    topReviewItemId?: string | null;
    topReviewItemTitle?: string | null;
    dueNow?: string[];
    dueSoon?: string[];
    stable?: string[];
    latestDailyPractice?: { practiceDate?: string; summary?: string | null; completedAt?: string | Date | null } | null;
    suggestedHomeSupport?: string;
  } | undefined) ?? null;
  return (
    <AppShell active="/parent-report">
      <PageHeader eyebrow="Parent Report" title="Plain-language progress summary"><p>This page translates learning intelligence into parent-friendly language. It is not a grade report.</p></PageHeader>
      <Card className="bg-[#fffaf2]">
        <div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm text-[#64716c]">Student</p><h3 className="text-2xl font-semibold">{student.name}</h3></div><Pill tone="ink">Year 6 Maths</Pill></div>
        <p className="mt-5 text-xl leading-8 text-[#263632]">{report?.summary ?? "No report yet. Complete the diagnostic first so the system can create a useful parent summary."}</p>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card><h3 className="mb-3 text-lg font-semibold">Current strengths</h3>{strengths.length ? <ul className="space-y-2">{strengths.map((s)=><li key={s} className="rounded-2xl bg-[#edf3e6] p-3 text-sm">{s}</li>)}</ul> : <p className="text-[#64716c]">Strengths will appear after diagnostic evidence is collected.</p>}</Card>
        <Card><h3 className="mb-3 text-lg font-semibold">Current focus areas</h3>{focusAreas.length ? <ul className="space-y-2">{focusAreas.map((s)=><li key={s} className="rounded-2xl bg-[#f6f0e5] p-3 text-sm">{s}</li>)}</ul> : <p className="text-[#64716c]">No focus areas yet.</p>}</Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card><h3 className="mb-3 text-lg font-semibold">Ideas we are checking</h3>{misconceptionNotes.length ? <ul className="space-y-2">{misconceptionNotes.map((s)=><li key={s} className="rounded-2xl bg-[#f4dfbd] p-3 text-sm">{s}</li>)}</ul> : <p className="text-[#64716c]">No strong pattern has been detected yet.</p>}</Card>
        <Card><h3 className="mb-3 text-lg font-semibold">Recommended home support</h3><p className="leading-7 text-[#53615c]">{report?.recommendedHomeSupport ?? recommendation?.parentFriendlyRationale ?? "After the first diagnostic, this area will suggest a short, parent-friendly way to support learning at home."}</p></Card>
      </div>

      <Card className="mt-5 border-[#caa05f] bg-[#fff7e8]">
        <h3 className="mb-3 text-lg font-semibold">Today’s practice</h3>
        {retentionStatus?.latestDailyPractice ? (
          <div>
            <p className="text-sm text-[#64716c]">Latest completed daily practice: {retentionStatus.latestDailyPractice.practiceDate}</p>
            <p className="mt-2 text-xl leading-8 text-[#263632]">{retentionStatus.latestDailyPractice.summary ?? "Daily practice was completed and saved to the learning profile."}</p>
          </div>
        ) : <p className="text-[#64716c]">No daily practice has been completed yet. Start from Today to generate the first short practice set.</p>}
      </Card>

      <Card className="mt-5 border-[#cfded7] bg-[#f7fbf7]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Retention / review note</h3>
            <p className="max-w-3xl leading-7 text-[#53615c]">{retentionStatus?.summary ?? "Retention notes will appear after the system has enough evidence to decide what should be reviewed."}</p>
            {retentionStatus?.topReviewSkill ? <p className="mt-2 text-sm text-[#64716c]">Start with <span className="font-semibold text-[#10211f]">{retentionStatus.topReviewSkill}</span>{retentionStatus.topReviewItemTitle ? ` using “${retentionStatus.topReviewItemTitle}”.` : "."}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={(retentionStatus?.dueNowCount ?? 0) ? "red" : "green"}>Due now {retentionStatus?.dueNowCount ?? 0}</Pill>
            <Pill tone={(retentionStatus?.dueSoonCount ?? 0) ? "amber" : "green"}>Due soon {retentionStatus?.dueSoonCount ?? 0}</Pill>
            <Pill tone="green">Stable {retentionStatus?.stableCount ?? 0}</Pill>
          </div>
        </div>
        {retentionStatus?.dueNow?.length || retentionStatus?.dueSoon?.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#fffdf8] p-4"><p className="mb-2 font-semibold">Review now</p>{retentionStatus.dueNow?.length ? <ul className="space-y-2 text-sm text-[#53615c]">{retentionStatus.dueNow.map((item)=><li key={item}>• {item}</li>)}</ul> : <p className="text-sm text-[#64716c]">No urgent review item.</p>}</div>
            <div className="rounded-2xl bg-[#fffdf8] p-4"><p className="mb-2 font-semibold">Review soon</p>{retentionStatus.dueSoon?.length ? <ul className="space-y-2 text-sm text-[#53615c]">{retentionStatus.dueSoon.map((item)=><li key={item}>• {item}</li>)}</ul> : <p className="text-sm text-[#64716c]">No near-term review item.</p>}</div>
          </div>
        ) : null}
      </Card>
    </AppShell>
  );
}
