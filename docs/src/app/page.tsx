import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarCheck, CircleAlert, Clock3, Sparkles } from "lucide-react";
import { DashboardResetButton } from "./DashboardResetButton";
import { AppShell, Card, Meter, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { student, mastery, misconceptions, recommendations, evidenceEvents } = await getMvpState();
  const activeRecommendation = recommendations[0];
  const assessed = mastery.filter((m) => m.evidenceCount > 0);
  const avgAccuracy = assessed.length ? assessed.reduce((a, m) => a + m.accuracyScore, 0) / assessed.length : 0;
  const secure = mastery.filter((m) => m.masteryLevel >= 3).length;
  const watch = misconceptions.filter((m) => m.probability >= 35);

  return (
    <AppShell active="/">
      <PageHeader eyebrow="Learning Intelligence MVP" title="Haim’s Year 6 maths learning state">
        <p>This prototype proves the core loop for one persistent Year 6 student: diagnostic evidence updates mastery, misconceptions, recommendations, and parent reporting.</p>
      </PageHeader>


      <Card className="mb-5 border-[#caa05f] bg-[#fff7e8]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2"><CalendarCheck className="size-5 text-[#b77525]" /><Pill tone="amber">Main daily action</Pill></div>
            <h3 className="text-2xl font-semibold">Ready for today’s short maths practice?</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">Start here for a simple five-problem practice set chosen from Haim’s current recommendation and review needs.</p>
          </div>
          <Link href="/today" className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-6 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60]">Start today’s practice <ArrowRight className="size-4" /></Link>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-4">
        <Card><p className="text-sm text-[#64716c]">Student</p><h3 className="mt-2 text-2xl font-semibold">{student.name}</h3><p className="text-sm text-[#64716c]">{student.yearGroup} · {student.schoolContext}</p></Card>
        <Card><p className="text-sm text-[#64716c]">Directly assessed skills</p><h3 className="mt-2 text-3xl font-semibold">{assessed.length}</h3><p className="text-sm text-[#64716c]">of {mastery.length} MVP graph nodes. Untouched nodes stay baseline until they receive evidence.</p></Card>
        <Card><p className="text-sm text-[#64716c]">Secure or above</p><h3 className="mt-2 text-3xl font-semibold">{secure}</h3><p className="text-sm text-[#64716c]">requires explanation + evidence</p></Card>
        <Card><p className="text-sm text-[#64716c]">Evidence events</p><h3 className="mt-2 text-3xl font-semibold">{evidenceEvents.length}</h3><p className="text-sm text-[#64716c]">latest learning signals</p></Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="bg-[#10211f] text-[#f8efe1]">
          <div className="flex items-center gap-3"><Sparkles className="text-[#d99b4a]" /><Pill tone="amber">Recommended next action</Pill></div>
          <h3 className="mt-4 font-serif text-4xl font-semibold">{activeRecommendation?.recommendedAction ?? "Start Diagnostic"}</h3>
          <p className="mt-3 max-w-2xl text-[#d8cdbb]">{activeRecommendation?.studentFriendlyRationale ?? "Complete the first diagnostic so MasteryOS can build an evidence-based learning profile."}</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/today" className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f]">Start today’s practice <ArrowRight className="size-4" /></Link><Link href={activeRecommendation ? "/tutor" : "/diagnostic"} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 font-semibold text-[#f8efe1]">Open details <ArrowRight className="size-4" /></Link></div>
        </Card>
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BookOpenCheck className="size-5 text-[#2f6173]" /> Mastery overview</h3>
          <Meter value={avgAccuracy} label="Average diagnostic accuracy" />
          <div className="mt-4"><Meter value={assessed.length ? assessed.reduce((a,m)=>a+m.explanationScore,0)/assessed.length : 0} label="Explanation evidence" /></div>
          <div className="mt-4"><Meter value={assessed.length ? assessed.reduce((a,m)=>a+m.retentionScore,0)/assessed.length : 0} label="Retention estimate" /></div>
        </Card>
      </div>

      <Card className="mt-5 border-[#cfded7] bg-[#f7fbf7]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">What changes after a diagnostic?</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">
              A diagnostic updates the whole learning profile layer: evidence log, directly assessed skill mastery, misconception watchlist, next recommendation, tutor explanation, and parent report. It does not automatically mark every graph node as assessed; untested nodes remain baseline until the platform has evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={evidenceEvents.length ? "green" : "blue"}>Evidence {evidenceEvents.length}</Pill>
            <Pill tone={assessed.length ? "green" : "blue"}>Assessed {assessed.length}</Pill>
            <Pill tone={watch.length ? "amber" : "blue"}>Misconceptions {watch.length}</Pill>
            <Pill tone={activeRecommendation ? "green" : "blue"}>{activeRecommendation ? "Recommendation ready" : "No recommendation yet"}</Pill>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><CircleAlert className="size-5 text-[#b77525]" /> Ideas to check</h3>
          {watch.length === 0 ? <p className="text-[#64716c]">No strong misconception pattern yet. Run the diagnostic to collect evidence.</p> : <div className="space-y-3">{watch.slice(0,3).map((m)=><div key={m.id} className="rounded-2xl bg-[#f6f0e5] p-4"><div className="flex justify-between gap-3"><p className="font-medium">{m.misconception.name}</p><Pill tone={m.probability>=60 ? "red" : "amber"}>{m.status}</Pill></div><Meter value={m.probability} label="Pattern probability" /></div>)}</div>}
        </Card>
        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Clock3 className="size-5 text-[#2f6173]" /> Current skill cards</h3>
          <div className="space-y-3">
            {mastery.filter((m) => m.evidenceCount > 0).length ? mastery.filter((m) => m.evidenceCount > 0).slice(0, 4).map((m) => <div key={m.id} className="rounded-2xl border border-[#eadfce] p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium">{m.skill.microSkill}</p><Pill tone={m.masteryLevel>=3 ? "green" : "blue"}>L{m.masteryLevel} · {m.aiState}</Pill></div><p className="mt-2 text-sm text-[#64716c]">{m.whyThisStatus}</p></div>) : <p className="rounded-2xl bg-[#fffdf8] p-4 text-[#64716c]">No skill evidence yet. Complete the diagnostic to generate the first skill cards.</p>}
          </div>
        </Card>
      </div>

      <DashboardResetButton />
    </AppShell>
  );
}
