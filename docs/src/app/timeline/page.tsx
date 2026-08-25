import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, GitCompareArrows, History, TrendingUp } from "lucide-react";
import { AppShell, Card, Meter, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getTimelineState } from "@/lib/learning/timeline";

export const dynamic = "force-dynamic";

function toneForDelta(delta: number | null) {
  if (delta === null) return "blue" as const;
  if (delta > 0) return "green" as const;
  if (delta < 0) return "red" as const;
  return "blue" as const;
}

function deltaText(delta: number | null) {
  if (delta === null) return "baseline";
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

export default async function TimelinePage() {
  const { student, attempts, totalAttempts } = await getTimelineState();
  const latest = attempts[0];
  return (
    <AppShell active="/timeline">
      <PageHeader eyebrow="Learning Timeline" title="What changed after each activity">
        <p>
          This page is the reasoning log behind MasteryOS. It groups diagnostic, next-action, retention-practice, and daily-practice evidence by attempt and explains improvement, correction, misconception signals, and recommendation changes.
        </p>
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-4">
        <Card><p className="text-sm text-[#64716c]">Student</p><h3 className="mt-2 text-2xl font-semibold">{student.name}</h3><p className="text-sm text-[#64716c]">{student.yearGroup} · timeline view</p></Card>
        <Card><p className="text-sm text-[#64716c]">Learning activities</p><h3 className="mt-2 text-3xl font-semibold">{totalAttempts}</h3><p className="text-sm text-[#64716c]">grouped by attempt ID</p></Card>
        <Card><p className="text-sm text-[#64716c]">Latest accuracy</p><h3 className="mt-2 text-3xl font-semibold">{latest ? `${latest.avgAccuracy}%` : "—"}</h3><p className="text-sm text-[#64716c]">current evidence only, not permanent retention</p></Card>
        <Card><p className="text-sm text-[#64716c]">Latest action</p><h3 className="mt-2 text-2xl font-semibold">{latest?.recommendation?.recommendedAction ?? "None yet"}</h3><p className="text-sm text-[#64716c]">nearest recommendation after attempt</p></Card>
      </div>

      <Card className="mt-5 border-[#cfded7] bg-[#f7fbf7]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold"><History className="size-5 text-[#2f6173]" /> Why timeline matters</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">
              A diagnostic, next activity, retention practice, or daily practice should not disappear into a score. The timeline shows what the system learned, whether a misconception signal was repaired, and why the next recommendation changed. Later, this same reasoning will explain why a daily math plan chooses specific tasks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/diagnostic" className="inline-flex items-center gap-2 rounded-full bg-[#10211f] px-4 py-2 text-sm font-semibold text-[#f8efe1]">Run diagnostic <ArrowRight className="size-4" /></Link><Link href="/next" className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-4 py-2 text-sm font-semibold text-[#10211f]">Next action <ArrowRight className="size-4" /></Link><Link href="/retention" className="inline-flex items-center gap-2 rounded-full bg-[#10211f] px-4 py-2 text-sm font-semibold text-[#f8efe1]">Retention queue <ArrowRight className="size-4" /></Link></div>
        </div>
      </Card>

      {attempts.length === 0 ? (
        <Card className="mt-5 text-center">
          <h3 className="text-2xl font-semibold">No learning activities yet</h3>
          <p className="mx-auto mt-3 max-w-2xl text-[#64716c]">Complete a diagnostic to create the first learning timeline entry. The timeline will then show evidence, misconception signals, and recommendation changes.</p>
          <Link href="/diagnostic" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f]">Start diagnostic <ArrowRight className="size-4" /></Link>
        </Card>
      ) : (
        <div className="mt-5 space-y-5">
          {attempts.map((attempt, index) => (
            <Card key={attempt.attemptId} className={index === 0 ? "border-[#caa05f] bg-[#fffaf0]" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={index === 0 ? "amber" : "blue"}>{index === 0 ? "Latest attempt" : `Attempt ${totalAttempts - index}`}</Pill>
                    <Pill tone={attempt.activityType === "Daily Practice" ? "blue" : attempt.activityType === "Retention Practice" ? "amber" : attempt.activityType === "Next Best Action" ? "green" : "ink"}>{attempt.activityType}</Pill>
                    <Pill tone="ink">{attempt.evidenceCount} evidence events</Pill>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold">{attempt.createdAt.toLocaleString()}</h3>
                  <p className="mt-2 max-w-3xl leading-7 text-[#53615c]">{attempt.parentSummary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={toneForDelta(attempt.comparison.accuracyDelta)}>Accuracy {deltaText(attempt.comparison.accuracyDelta)}</Pill>
                  <Pill tone={toneForDelta(attempt.comparison.explanationDelta)}>Explanation {deltaText(attempt.comparison.explanationDelta)}</Pill>
                  <Pill tone={attempt.detectedSignals.length ? "amber" : "green"}>{attempt.detectedSignals.length ? `${attempt.detectedSignals.length} signal(s)` : "No signals"}</Pill>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-5">
                <Meter value={attempt.avgAccuracy} label="Accuracy" />
                <Meter value={attempt.avgExplanation} label="Explanation" />
                <Meter value={attempt.avgTransfer} label="Transfer" />
                <Meter value={attempt.avgRetention} label="Retention estimate" />
                <Meter value={attempt.representationUse} label="Representation use" />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-2xl bg-[#f6f0e5] p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp className="size-4 text-[#2f6173]" /> What changed</h4>
                  <ul className="space-y-2 text-sm text-[#53615c]">
                    {attempt.changeBullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
                    {attempt.improvedSkills.length ? <li>• {attempt.improvedSkills.length} skill(s) showed improvement or correction.</li> : null}
                    {attempt.declinedSkills.length ? <li>• {attempt.declinedSkills.length} skill(s) need attention because evidence declined.</li> : null}
                    {attempt.reducedSignals.length ? <li>• Corrective evidence reduced earlier signals: {attempt.reducedSignals.join(", ")}.</li> : null}
                    {attempt.persistentSignals.length ? <li>• Persistent signals still need monitoring: {attempt.persistentSignals.join(", ")}.</li> : null}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#10211f] p-4 text-[#f8efe1]">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold"><GitCompareArrows className="size-4 text-[#d99b4a]" /> Recommendation after attempt</h4>
                  {attempt.recommendation ? (
                    <div>
                      <p className="text-2xl font-semibold">{attempt.recommendation.recommendedAction}</p>
                      <p className="mt-2 text-sm leading-6 text-[#d8cdbb]">{attempt.recommendation.studentFriendlyRationale}</p>
                      <p className="mt-3 font-mono text-xs text-[#b9aa91]">{attempt.recommendation.targetSkillNodeId ?? attempt.recommendation.targetMisconceptionId ?? "profile-level recommendation"}</p>
                    </div>
                  ) : <p className="text-sm text-[#d8cdbb]">No recommendation captured for this attempt.</p>}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#eadfce] p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-[#4c7a3a]" /> Skill changes</h4>
                  <div className="space-y-2">
                    {attempt.skillChanges.slice(0, 6).map((skill) => (
                      <div key={skill.skillNodeId} className="rounded-2xl bg-[#fffdf8] p-3 text-sm">
                        <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{skill.microSkill}</p><Pill tone={skill.corrected ? "green" : skill.declined ? "red" : "blue"}>{skill.skillNodeId}</Pill></div>
                        <p className="mt-1 text-[#64716c]">Accuracy {skill.correctness}% ({deltaText(skill.accuracyDelta)}) · Explanation {skill.explanationScore}% ({deltaText(skill.explanationDelta)}) · Transfer {skill.transferScore}% ({deltaText(skill.transferDelta)})</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadfce] p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold"><CircleAlert className="size-4 text-[#b77525]" /> Misconception signals</h4>
                  {attempt.detectedSignals.length ? <div className="space-y-2">{attempt.detectedSignals.map((signal) => <div key={signal.id} className="rounded-2xl bg-[#f4dfbd] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{signal.id}</p><Pill tone="amber">weight {Math.round(signal.weight)}</Pill></div><p className="mt-1 text-[#754714]">{signal.reason}</p></div>)}</div> : <p className="rounded-2xl bg-[#edf3e6] p-3 text-sm text-[#36582e]">No misconception signal appeared in this attempt.</p>}
                  {attempt.reducedSignals.length ? <p className="mt-3 rounded-2xl bg-[#edf3e6] p-3 text-sm text-[#36582e]">Reduced from previous attempt: {attempt.reducedSignals.join(", ")}</p> : null}
                </div>
              </div>

              <details className="mt-5 rounded-2xl bg-[#f6f0e5] p-4 text-sm">
                <summary className="cursor-pointer font-semibold">Developer / academic details</summary>
                <div className="mt-3 grid gap-3 text-[#53615c] md:grid-cols-2">
                  <p><span className="font-semibold text-[#10211f]">Attempt ID:</span> <span className="font-mono text-xs">{attempt.attemptId}</span></p>
                  <p><span className="font-semibold text-[#10211f]">Confidence calibration:</span> {attempt.avgConfidenceCalibration}%</p>
                  <p><span className="font-semibold text-[#10211f]">New signals:</span> {attempt.newSignals.join(", ") || "none"}</p>
                  <p><span className="font-semibold text-[#10211f]">Persistent signals:</span> {attempt.persistentSignals.join(", ") || "none"}</p>
                </div>
              </details>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
