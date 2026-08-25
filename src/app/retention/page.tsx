import Link from "next/link";
import { ArrowRight, Brain, CalendarClock, CircleHelp, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell, Card, Meter, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getRetentionQueueState, retentionMisconceptionIds, type RetentionQueueEntry, type RetentionStatus } from "@/lib/learning/retention-queue";

export const dynamic = "force-dynamic";

const statusTone: Record<RetentionStatus, "blue" | "amber" | "green" | "red" | "ink"> = {
  "Due now": "red",
  "Due soon": "amber",
  Stable: "green",
  "Needs more evidence": "blue",
};

const sectionNotes: Record<RetentionStatus, string> = {
  "Due now": "These are the best short-review candidates right now.",
  "Due soon": "These are not urgent, but should be checked in the next few days.",
  Stable: "These can wait while weaker or older skills are reviewed first.",
  "Needs more evidence": "These skills have not been checked directly yet, so the app should not guess.",
};

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Not yet";
}

function itemTone(type?: string) {
  if (type === "Retention") return "green" as const;
  if (type === "Review") return "blue" as const;
  return "ink" as const;
}

function EntryCard({ entry }: { entry: RetentionQueueEntry }) {
  const item = entry.selectedItem;
  const misconceptionIds = item ? retentionMisconceptionIds(item.misconceptionIds) : [];
  return (
    <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf8] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-[#94652e]">{entry.skillNodeId}</p>
          <h4 className="mt-1 text-lg font-semibold">{entry.skillName}</h4>
          <p className="mt-1 text-sm text-[#64716c]">{entry.strand} · {entry.subskill}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone={statusTone[entry.status]}>{entry.status}</Pill>
          <Pill tone={entry.masteryLevel >= 3 ? "green" : "blue"}>L{entry.masteryLevel}</Pill>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Meter value={entry.masteryEstimate} label="Mastery estimate" />
        <Meter value={entry.retentionScore} label="Retention" />
        <Meter value={entry.misconceptionRiskScore} label="Misconception risk" />
      </div>

      <div className="mt-4 rounded-2xl bg-[#f6f0e5] p-4 text-sm leading-6 text-[#53615c]">
        <p className="font-semibold text-[#10211f]">Why this status</p>
        <ul className="mt-2 space-y-1">
          {entry.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
        </ul>
        <p className="mt-2"><span className="font-semibold text-[#10211f]">Suggested timing:</span> {entry.suggestedTiming}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-2xl border border-[#eadfce] p-3"><p className="text-[#64716c]">Last practised</p><p className="font-semibold">{formatDate(entry.lastPracticedAt)}</p></div>
        <div className="rounded-2xl border border-[#eadfce] p-3"><p className="text-[#64716c]">Next review due</p><p className="font-semibold">{formatDate(entry.nextReviewDueAt)}</p></div>
        <div className="rounded-2xl border border-[#eadfce] p-3"><p className="text-[#64716c]">Evidence count</p><p className="font-semibold">{entry.evidenceCount}</p></div>
      </div>

      {entry.relatedMisconceptions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.relatedMisconceptions.slice(0, 3).map((mis) => <Pill key={mis.id} tone={mis.probability >= 60 ? "red" : "amber"}>{mis.id} · {mis.probability}%</Pill>)}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-[#10211f] p-4 text-[#f8efe1]">
        {item ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2"><Pill tone={itemTone(item.itemType)}>{item.itemType}</Pill><Pill tone="amber">difficulty {item.difficulty}/5</Pill><Pill tone="blue">{item.transferLevel} transfer</Pill></div>
              <h5 className="mt-3 text-xl font-semibold">{item.title}</h5>
              <p className="mt-2 text-sm leading-6 text-[#d8cdbb]">{item.prompt}</p>
              {misconceptionIds.length ? <p className="mt-2 font-mono text-xs text-[#b9aa91]">Misconception mapping: {misconceptionIds.join(", ")}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="mb-3 text-xs text-[#b9aa91]">Used {entry.itemPriorUseCount} time{entry.itemPriorUseCount === 1 ? "" : "s"}</p>
              <Link href={`/next?itemId=${item.itemId}`} className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-4 py-2 text-sm font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60]">
                Practise this review item <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <Pill tone="ink">No review item currently available</Pill>
            <p className="mt-3 text-sm leading-6 text-[#d8cdbb]">The queue can identify the skill, but the item bank does not yet have an active Review or Retention item for it.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueSection({ title, entries }: { title: RetentionStatus; entries: RetentionQueueEntry[] }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-[#64716c]">{sectionNotes[title]}</p>
        </div>
        <Pill tone={statusTone[title]}>{entries.length} skill{entries.length === 1 ? "" : "s"}</Pill>
      </div>
      <div className="space-y-4">
        {entries.length ? entries.map((entry) => <EntryCard key={entry.skillNodeId} entry={entry} />) : <p className="rounded-2xl bg-[#f6f0e5] p-4 text-sm text-[#64716c]">Nothing in this group right now.</p>}
      </div>
    </Card>
  );
}

export default async function RetentionPage() {
  const state = await getRetentionQueueState();
  const top = state.topDueEntry;
  return (
    <AppShell active="/retention">
      <PageHeader eyebrow="Retention Queue" title="What should be reviewed before it fades?">
        <p>
          Retention means “can Haim still remember and explain this later?” This page does not create lessons or worksheets. It uses existing evidence to choose short review checks from the item bank.
        </p>
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-4">
        <Card><p className="text-sm text-[#64716c]">Due now</p><h3 className="mt-2 text-3xl font-semibold">{state.counts["Due now"]}</h3><p className="text-sm text-[#64716c]">review first</p></Card>
        <Card><p className="text-sm text-[#64716c]">Due soon</p><h3 className="mt-2 text-3xl font-semibold">{state.counts["Due soon"]}</h3><p className="text-sm text-[#64716c]">check in days</p></Card>
        <Card><p className="text-sm text-[#64716c]">Stable</p><h3 className="mt-2 text-3xl font-semibold">{state.counts.Stable}</h3><p className="text-sm text-[#64716c]">can wait</p></Card>
        <Card><p className="text-sm text-[#64716c]">Needs evidence</p><h3 className="mt-2 text-3xl font-semibold">{state.counts["Needs more evidence"]}</h3><p className="text-sm text-[#64716c]">do not guess</p></Card>
      </div>

      <Card className="mt-5 bg-[#10211f] text-[#f8efe1]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3"><RefreshCw className="text-[#d99b4a]" /><Pill tone="amber">Retention summary</Pill></div>
            <h3 className="mt-4 font-serif text-3xl font-semibold">{state.summary}</h3>
            <p className="mt-3 max-w-3xl text-[#d8cdbb]">
              The queue looks at how recent the evidence is, whether the latest answer was correct, explanation quality, confidence calibration, retention score, and misconception risk.
            </p>
          </div>
          {top?.selectedItem ? (
            <Link href={`/next?itemId=${top.selectedItem.itemId}`} className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60]">
              Practise top review item <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link href="/diagnostic" className="inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f] transition hover:-translate-y-0.5 hover:bg-[#e7ad60]">
              Collect evidence <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="border-[#cfded7] bg-[#f7fbf7]"><h3 className="mb-2 flex items-center gap-2 font-semibold"><CalendarClock className="size-5 text-[#2f6173]" /> Review timing</h3><p className="text-sm leading-6 text-[#53615c]">Sprint D uses simple timing rules only. It is not a full spaced-repetition calendar yet.</p></Card>
        <Card className="border-[#cfded7] bg-[#f7fbf7]"><h3 className="mb-2 flex items-center gap-2 font-semibold"><Brain className="size-5 text-[#2f6173]" /> Evidence-based</h3><p className="text-sm leading-6 text-[#53615c]">The queue reads the current mastery profile and evidence events rather than redesigning the curriculum.</p></Card>
        <Card className="border-[#cfded7] bg-[#f7fbf7]"><h3 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-[#2f6173]" /> Parent-safe language</h3><p className="text-sm leading-6 text-[#53615c]">Due now means “worth a short check,” not failure or extra homework.</p></Card>
      </div>

      <div className="mt-5 space-y-5">
        <QueueSection title="Due now" entries={state.sections["Due now"]} />
        <QueueSection title="Due soon" entries={state.sections["Due soon"]} />
        <QueueSection title="Stable" entries={state.sections.Stable} />
        <QueueSection title="Needs more evidence" entries={state.sections["Needs more evidence"]} />
      </div>

      <Card className="mt-5 border-[#dfd3c0] bg-white/60">
        <h3 className="flex items-center gap-2 font-semibold"><CircleHelp className="size-5 text-[#b77525]" /> Why some skills have no button</h3>
        <p className="mt-2 text-sm leading-6 text-[#53615c]">
          The queue can identify a skill from the graph even if the item bank does not yet have a Retention or Review item for that exact skill. In Sprint D, it shows that transparently instead of inventing lesson content.
        </p>
      </Card>
    </AppShell>
  );
}
