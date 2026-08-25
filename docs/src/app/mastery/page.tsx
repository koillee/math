import { AppShell, Card, Meter, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function MasteryPage() {
  const { mastery } = await getMvpState();
  return (
    <AppShell active="/mastery">
      <PageHeader eyebrow="Mastery Profile" title="Skill-level learning state"><p>Mastery is based on accuracy, explanation, representation, transfer, retention, confidence calibration, and misconception risk—not completion alone.</p></PageHeader>
      <div className="grid gap-4">
        {mastery.map((m) => (
          <Card key={m.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono text-xs text-[#94652e]">{m.skillNodeId}</p><h3 className="mt-1 text-xl font-semibold">{m.skill.microSkill}</h3><p className="mt-1 text-sm text-[#64716c]">{m.skill.strand} · {m.skill.subskill}</p></div>
              <div className="flex gap-2"><Pill tone={m.masteryLevel >= 3 ? "green" : "blue"}>Level {m.masteryLevel}</Pill><Pill tone={m.aiState === "Review Needed" ? "amber" : "ink"}>{m.aiState}</Pill></div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <Meter value={m.accuracyScore} label="Accuracy" />
              <Meter value={m.explanationScore} label="Explanation" />
              <Meter value={m.transferScore} label="Transfer" />
              <Meter value={m.retentionScore} label="Retention" />
            </div>
            <details className="mt-4 rounded-2xl bg-[#f6f0e5] p-4"><summary className="cursor-pointer font-semibold">Why this status?</summary><p className="mt-2 text-sm text-[#53615c]">{m.whyThisStatus}</p><p className="mt-2 text-xs text-[#7b6d5d]">Evidence count: {m.evidenceCount} · Model confidence: {Math.round(m.modelConfidence)}% · Misconception risk: {Math.round(m.misconceptionRiskScore)}%</p></details>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
