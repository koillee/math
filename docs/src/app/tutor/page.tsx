import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, MessageCircleWarning, RefreshCw } from "lucide-react";
import { AppShell, Card, Meter, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";
import { getRetentionQueueState } from "@/lib/learning/retention-queue";
import { getLatestDailyPracticeSummary } from "@/lib/learning/todays-practice";

export const dynamic = "force-dynamic";

export default async function TutorPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const submitted = params.submitted === "1";
  const nextSubmitted = params.next === "1";
  const retentionSubmitted = params.retention === "1";
  const [{ recommendations, evidenceEvents, misconceptions, mastery, student }, retentionQueue] = await Promise.all([getMvpState(), getRetentionQueueState()]);
  const latestDailyPractice = await getLatestDailyPracticeSummary(student.id);
  const recommendation = recommendations[0];
  const latest = evidenceEvents.slice(0, 4);
  const topMis = misconceptions[0];
  const topSkill = mastery.filter((m)=>m.evidenceCount>0).sort((a,b)=>b.misconceptionRiskScore-a.misconceptionRiskScore || a.accuracyScore-b.accuracyScore)[0];
  const assessedSkillCount = mastery.filter((m) => m.evidenceCount > 0).length;
  return (
    <AppShell active="/tutor">
      <PageHeader eyebrow="AI Tutor Feedback" title="What the tutor noticed"><p>This MVP uses a deterministic rule-based tutor so every recommendation is inspectable. A model-based tutor can later plug into the same evidence layer.</p></PageHeader>
      {submitted ? <div className="mb-5 rounded-[1.5rem] border border-[#cfe0c5] bg-[#edf7e8] p-4 font-semibold text-[#244d32]">Diagnostic saved. The mastery profile, misconception watchlist, recommendation, parent report, and evidence log have all been updated.</div> : null}
      {nextSubmitted ? <div className="mb-5 rounded-[1.5rem] border border-[#cfe0c5] bg-[#edf7e8] p-4 font-semibold text-[#244d32]">Next activity saved. The selected skill, recommendation, parent report, evidence log, and timeline have been refreshed.</div> : null}
      {retentionSubmitted ? <div className="mb-5 rounded-[1.5rem] border border-[#cfe0c5] bg-[#edf7e8] p-4 font-semibold text-[#244d32]">Retention practice saved. Mastery, recommendation, parent report, evidence log, and timeline have been refreshed.</div> : null}
      <Card className="mb-5 border-[#cfded7] bg-[#f7fbf7]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Profile update coverage</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">
              The diagnostic updates every profile layer, but only skills that received diagnostic evidence are counted as directly assessed. Other graph nodes stay in their baseline state until future diagnostics, reviews, or learning-path activities generate evidence for them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="green">Evidence events {evidenceEvents.length}</Pill>
            <Pill tone="green">Assessed skills {assessedSkillCount}</Pill>
            <Pill tone={misconceptions.length ? "amber" : "blue"}>Misconception records {misconceptions.length}</Pill>
            <Pill tone={recommendation ? "green" : "blue"}>{recommendation ? "Recommendation active" : "No recommendation"}</Pill>
          </div>
        </div>
      </Card>
      <Card className="bg-[#10211f] text-[#f8efe1]">
        <div className="flex items-center gap-3"><Brain className="text-[#d99b4a]" /><Pill tone="amber">Current recommendation</Pill></div>
        <h3 className="mt-4 font-serif text-4xl font-semibold">{recommendation?.recommendedAction ?? "Run the diagnostic first"}</h3>
        <p className="mt-4 max-w-3xl text-lg text-[#d8cdbb]">{recommendation?.studentFriendlyRationale ?? "I need diagnostic evidence before I can recommend a precise next step."}</p>
        <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-[#e8ddca]">Parent view: {recommendation?.parentFriendlyRationale ?? "The platform has not collected enough evidence yet."}</p>
        {recommendation ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/next" className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60]">Do recommended next activity <ArrowRight className="size-4" /></Link>
            <p className="font-mono text-xs text-[#b9aa91]">Internal: {recommendation.internalRationale}</p>
          </div>
        ) : <Link href="/diagnostic" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f]">Start diagnostic <ArrowRight className="size-4" /></Link>}
      </Card>


      <Card className="mt-5 border-[#caa05f] bg-[#fff7e8]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Today’s practice result</h3>
            {latestDailyPractice ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">{latestDailyPractice.summary ?? `Completed daily practice for ${latestDailyPractice.practiceDate}.`}</p> : <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">No daily practice has been completed yet today. Use Today to start a short five-problem set.</p>}
          </div>
          <Link href="/today" className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-4 py-2 text-sm font-semibold text-[#10211f]">Open Today <ArrowRight className="size-4" /></Link>
        </div>
      </Card>

      <Card className="mt-5 border-[#dfd3c0] bg-[#fffaf2]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold"><RefreshCw className="size-5 text-[#2f6173]" /> Retention queue summary</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">{retentionQueue.summary}</p>
            {retentionQueue.topDueEntry ? <p className="mt-2 text-sm text-[#64716c]">Top review candidate: <span className="font-semibold text-[#10211f]">{retentionQueue.topDueEntry.skillName}</span></p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={retentionQueue.counts["Due now"] ? "red" : "green"}>Due now {retentionQueue.counts["Due now"]}</Pill>
            <Pill tone={retentionQueue.counts["Due soon"] ? "amber" : "green"}>Due soon {retentionQueue.counts["Due soon"]}</Pill>
            <Link href="/retention" className="inline-flex items-center gap-2 rounded-full bg-[#10211f] px-4 py-2 text-sm font-semibold text-[#f8efe1]">View retention queue <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><MessageCircleWarning className="size-5 text-[#b77525]" /> Most important learning signal</h3>
          {topMis ? <div><p className="text-xl font-semibold">{topMis.misconception.name}</p><p className="mt-2 text-[#64716c]">{topMis.misconception.description}</p><div className="mt-4"><Meter value={topMis.probability} label={`Status: ${topMis.status}`} /></div><p className="mt-3 text-sm text-[#64716c]">Root cause: {topMis.misconception.rootCause}</p></div> : <p className="text-[#64716c]">No misconception signal has been detected yet.</p>}
        </Card>
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="size-5 text-[#2f6173]" /> Skill needing attention</h3>
          {topSkill ? <div><p className="text-xl font-semibold">{topSkill.skill.microSkill}</p><p className="mt-2 text-[#64716c]">{topSkill.whyThisStatus}</p><div className="mt-4"><Meter value={topSkill.accuracyScore} label="Accuracy evidence" /></div><div className="mt-3"><Meter value={topSkill.explanationScore} label="Explanation evidence" /></div></div> : <p className="text-[#64716c]">Complete the diagnostic to create skill-level evidence.</p>}
        </Card>
      </div>
      <Card className="mt-5">
        <h3 className="mb-4 text-lg font-semibold">Latest evidence interpreted by tutor</h3>
        <div className="grid gap-3">{latest.length ? latest.map((e)=><div key={e.id} className="rounded-2xl bg-[#f6f0e5] p-4"><div className="flex justify-between gap-3"><p className="font-medium">{e.skill.microSkill}</p><Pill tone={e.correctness ? "green" : "amber"}>{e.correctness ? "correct" : "check"}</Pill></div><p className="mt-1 text-sm text-[#64716c]">Response: {e.response || "No answer"}</p><p className="mt-1 text-sm text-[#64716c]">Explanation score: {Math.round(e.explanationScore)} · Confidence calibration: {Math.round(e.confidenceCalibration)}</p></div>) : <p className="text-[#64716c]">No evidence yet.</p>}</div>
      </Card>
    </AppShell>
  );
}
