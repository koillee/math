import Link from "next/link";
import { ArrowRight, Brain, Route, Sparkles, Target } from "lucide-react";
import { NextActivityForm } from "./NextActivityForm";
import { AppShell, Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import { acceptedAnswers, getNextBestActionState, misconceptionIds, representationOptions } from "@/lib/learning/next-best-action";

export const dynamic = "force-dynamic";

function toneForType(type: string) {
  if (type === "Misconception Repair") return "red" as const;
  if (type === "Transfer" || type === "Challenge") return "amber" as const;
  if (type === "Retention") return "green" as const;
  if (type === "Diagnostic") return "ink" as const;
  return "blue" as const;
}

export default async function NextPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const requestedItemId = typeof params.itemId === "string" ? params.itemId : undefined;
  const state = await getNextBestActionState({ requestedItemId });
  const item = state.selectedItem;
  const ids = item ? misconceptionIds(item.misconceptionIds) : [];
  const reps = item ? representationOptions(item.representationOptions) : [];
  const activityLabel = state.activityType === "retention" ? "Retention Practice" : (state.recommendation?.recommendedAction ?? "Next Best Action");
  const rationale = state.activityType === "retention"
    ? "This item comes from the retention queue. It checks whether the skill is still remembered and explainable."
    : (state.recommendation?.studentFriendlyRationale ?? "I need diagnostic evidence before I can recommend a precise next step.");

  return (
    <AppShell active="/next">
      <PageHeader eyebrow="Next Best Action" title="Do the one next activity">
        <p>
          This page turns either the current recommendation or a retention-queue choice into one selected item from the item bank. It is not a worksheet or lesson; it is one focused activity that creates fresh evidence.
        </p>
      </PageHeader>

      {!item ? (
        <Card className="text-center">
          <Brain className="mx-auto mb-4 size-10 text-[#2f6173]" />
          <h3 className="text-2xl font-semibold">Run the diagnostic first</h3>
          <p className="mx-auto mt-3 max-w-2xl text-[#64716c]">{state.reason}</p>
          <Link href="/diagnostic" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f]">Start diagnostic <ArrowRight className="size-4" /></Link>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="bg-[#10211f] text-[#f8efe1]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><Sparkles className="text-[#d99b4a]" /><Pill tone="amber">{state.activityType === "retention" ? "Retention queue choice" : "Current recommendation"}</Pill></div>
              <Pill tone={state.fallbackUsed ? "amber" : "green"}>{state.fallbackUsed ? "closest match" : "targeted match"}</Pill>
            </div>
            <h3 className="mt-4 font-serif text-4xl font-semibold">{activityLabel}</h3>
            <p className="mt-4 max-w-3xl text-lg text-[#d8cdbb]">{rationale}</p>
            <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-[#e8ddca]">Why this item was chosen: {state.reason}</p>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[#94652e]">{item.itemId} · {item.skillNodeId}</p>
                  <h3 className="mt-2 text-3xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[#64716c]">{item.skill.microSkill}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={toneForType(item.itemType)}>{item.itemType}</Pill>
                  <Pill tone="amber">difficulty {item.difficulty}/5</Pill>
                  <Pill tone="blue">{item.transferLevel} transfer</Pill>
                </div>
              </div>
              <p className="mt-5 rounded-[1.5rem] bg-[#f6f0e5] p-5 text-xl leading-8 text-[#263632]">{item.prompt}</p>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Target className="size-5 text-[#2f6173]" /> What this activity checks</h3>
              <div className="space-y-3 text-sm text-[#53615c]">
                <p><span className="font-semibold text-[#10211f]">Skill:</span> {item.skill.skill} · {item.skill.subskill}</p>
                <p><span className="font-semibold text-[#10211f]">Evidence category:</span> {item.evidenceCategory}</p>
                <p><span className="font-semibold text-[#10211f]">Item family:</span> expected {state.expectedItemTypes.join(" / ") || item.itemType}</p>
                <p><span className="font-semibold text-[#10211f]">Prior use:</span> {state.priorUseCount} evidence event(s)</p>
                <div>
                  <p className="mb-2 font-semibold text-[#10211f]">Misconception mapping</p>
                  <div className="flex flex-wrap gap-2">{ids.length ? ids.map((id) => <Pill key={id} tone="red">{id}</Pill>) : <Pill tone="green">No direct misconception mapping</Pill>}</div>
                </div>
                <div>
                  <p className="mb-2 font-semibold text-[#10211f]">Useful representations</p>
                  <p>{reps.join(" · ") || "Mental reasoning is acceptable"}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-[#cfded7] bg-[#f7fbf7]">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Route className="size-5 text-[#2f6173]" /> After submission</h3>
            <p className="mt-2 text-sm leading-6 text-[#53615c]">
              The system will save one evidence event, update the selected skill, adjust misconception probability if the answer reveals or repairs a pattern, refresh the recommendation, and add the activity to the timeline.
            </p>
          </Card>

          <NextActivityForm itemId={item.itemId} placeholder={item.placeholder} representationOptions={reps} activityType={state.activityType} />

          <details className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/60 p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Developer / academic details</summary>
            <div className="mt-3 grid gap-3 text-[#53615c] md:grid-cols-2">
              <p><span className="font-semibold text-[#10211f]">Accepted-answer metadata:</span> {acceptedAnswers(item.acceptedAnswers).join(" · ") || "stored in item bank"}</p>
              <p><span className="font-semibold text-[#10211f]">Evidence weight:</span> {Math.round(item.evidenceWeight)}</p>
              <p><span className="font-semibold text-[#10211f]">Version:</span> {item.version}</p>
              <p><span className="font-semibold text-[#10211f]">Recommendation target:</span> {state.recommendation?.targetSkillNodeId ?? state.recommendation?.targetMisconceptionId ?? (state.activityType === "retention" ? "retention queue" : "profile-level")}</p>
            </div>
          </details>
        </div>
      )}
    </AppShell>
  );
}
