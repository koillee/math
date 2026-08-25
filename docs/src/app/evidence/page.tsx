import { AppShell, Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const { evidenceEvents } = await getMvpState();
  return (
    <AppShell active="/evidence">
      <PageHeader eyebrow="Developer View" title="Evidence event log"><p>Every diagnostic, next-action, retention-practice, or daily-practice interaction creates auditable evidence. This view exposes the raw learning-intelligence signals for debugging and academic transparency.</p></PageHeader>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#7b6d5d]"><tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Skill</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Correctness</th><th className="px-3 py-2">Confidence</th><th className="px-3 py-2">Explanation</th><th className="px-3 py-2">Misconception signals</th><th className="px-3 py-2">Weight</th></tr></thead>
            <tbody>{evidenceEvents.length ? evidenceEvents.map((e)=><tr key={e.id} className="bg-[#fffdf8]"><td className="rounded-l-2xl px-3 py-3 font-mono text-xs">{e.createdAt.toLocaleString()}</td><td className="px-3 py-3">{e.eventType}</td><td className="px-3 py-3"><span className="font-mono text-xs text-[#94652e]">{e.skillNodeId}</span><br />{e.skill.microSkill}</td><td className="px-3 py-3">{e.evidenceCategory}</td><td className="px-3 py-3"><Pill tone={e.correctness ? "green" : "amber"}>{Math.round(e.correctness)}%</Pill></td><td className="px-3 py-3">{e.confidenceRating}/5</td><td className="px-3 py-3">{Math.round(e.explanationScore)}</td><td className="px-3 py-3 font-mono text-xs">{JSON.stringify(e.misconceptionSignals)}</td><td className="rounded-r-2xl px-3 py-3">{Math.round(e.evidenceWeight)}</td></tr>) : <tr><td colSpan={9} className="rounded-2xl bg-[#fffdf8] px-4 py-8 text-center text-[#64716c]">No evidence yet. Complete the diagnostic assessment.</td></tr>}</tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
