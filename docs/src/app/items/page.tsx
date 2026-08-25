import { Archive, BrainCircuit, Layers3, ListFilter, Target } from "lucide-react";
import { AppShell, Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getItemBankItems, ITEM_TYPES } from "@/lib/learning/item-bank";
import { ensureSeedData } from "@/lib/learning/seed";

export const dynamic = "force-dynamic";

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function wrongAnswerSummary(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { answer?: unknown; misconceptionId?: unknown; reason?: unknown };
      return {
        answer: String(candidate.answer ?? ""),
        misconceptionId: candidate.misconceptionId ? String(candidate.misconceptionId) : null,
        reason: String(candidate.reason ?? ""),
      };
    })
    .filter((item): item is { answer: string; misconceptionId: string | null; reason: string } => Boolean(item?.answer || item?.reason));
}

function rubricPurpose(value: unknown) {
  if (!value || typeof value !== "object") return "Evidence metadata stored for future scoring.";
  const candidate = value as { evidencePurpose?: unknown };
  return String(candidate.evidencePurpose ?? "Evidence metadata stored for future scoring.");
}

const typeTone: Record<string, "blue" | "amber" | "green" | "red" | "ink"> = {
  Diagnostic: "ink",
  Review: "blue",
  Retention: "green",
  "Misconception Repair": "red",
  Transfer: "amber",
  Explanation: "blue",
  Challenge: "ink",
};

export default async function ItemBankPage() {
  await ensureSeedData();
  const items = await getItemBankItems();
  const activeCount = items.filter((item) => item.active).length;
  const distinctSkills = new Set(items.map((item) => item.skillNodeId)).size;
  const distinctDomains = [...new Set(items.map((item) => item.domain))].sort();
  const distinctMisconceptions = new Set(items.flatMap((item) => stringArray(item.misconceptionIds))).size;
  const avgDifficulty = items.length ? items.reduce((sum, item) => sum + item.difficulty, 0) / items.length : 0;
  const byType = ITEM_TYPES.map((type) => ({ type, items: items.filter((item) => item.itemType === type) })).filter((group) => group.items.length > 0);
  const diagnosticCount = items.filter((item) => item.itemType === "Diagnostic" && item.active).length;

  return (
    <AppShell active="/items">
      <PageHeader eyebrow="Structured Item Bank" title="Year 6 maths item bank">
        <p>
          The platform now uses a scalable item bank across FDP, Number & Operations, and Ratio/Proportion/Rates. These items are not worksheets or lessons; each one exists to collect skill, misconception,
          retention, transfer, explanation, or representation evidence.
        </p>
      </PageHeader>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Card className="bg-[#10211f] text-[#f8efe1]">
          <Archive className="mb-3 size-5 text-[#d99b4a]" />
          <p className="text-3xl font-semibold">{items.length}</p>
          <p className="text-sm text-[#d8cdbb]">Total seeded items</p>
        </Card>
        <Card>
          <Target className="mb-3 size-5 text-[#2f6173]" />
          <p className="text-3xl font-semibold">{diagnosticCount}</p>
          <p className="text-sm text-[#64716c]">Active diagnostic items</p>
        </Card>
        <Card>
          <BrainCircuit className="mb-3 size-5 text-[#94652e]" />
          <p className="text-3xl font-semibold">{distinctSkills}</p>
          <p className="text-sm text-[#64716c]">Mapped skill nodes</p>
        </Card>
        <Card>
          <Layers3 className="mb-3 size-5 text-[#36582e]" />
          <p className="text-3xl font-semibold">{distinctMisconceptions}</p>
          <p className="text-sm text-[#64716c]">Misconception mappings · avg difficulty {avgDifficulty.toFixed(1)}</p>
        </Card>
      </div>

      <Card className="mb-5 border-[#cfded7] bg-[#f7fbf7]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold"><ListFilter className="size-5 text-[#2f6173]" /> Bank structure</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53615c]">
              Grouped by item type. Adaptive selection can query the same metadata to choose the next best diagnostic, review, retention, repair, transfer, explanation, or challenge item across the seeded domains.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="green">Active {activeCount}</Pill>
            <Pill tone="blue">Subject Mathematics</Pill>
            <Pill tone="amber">Year 6 maths</Pill>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {distinctDomains.map((domain) => <Pill key={domain} tone="ink">{domain}</Pill>)}
        </div>
      </Card>

      <div className="space-y-6">
        {byType.map((group) => (
          <section key={group.type} className="rounded-[2rem] border border-[#dfd3c0] bg-white/45 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <Pill tone={typeTone[group.type] ?? "blue"}>{group.type}</Pill>
                <h3 className="mt-2 text-2xl font-semibold">{group.items.length} items</h3>
              </div>
              <p className="max-w-xl text-sm text-[#64716c]">
                {group.type === "Diagnostic" ? "The current diagnostic reads these active records from the bank." : "Seeded for future adaptive selection while keeping Sprint B read-only."}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map((item) => {
                const misconceptionIds = stringArray(item.misconceptionIds);
                const representations = stringArray(item.representationOptions);
                const wrongAnswers = wrongAnswerSummary(item.commonWrongAnswers);
                return (
                  <Card key={item.itemId} className="bg-[#fffdf8]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-[#94652e]">{item.itemId} · {item.skillNodeId}</p>
                        <h4 className="mt-1 text-lg font-semibold">{item.title}</h4>
                        <p className="mt-1 text-sm text-[#64716c]">{item.domain} · {item.strand} · {item.skill.microSkill}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Pill tone={item.active ? "green" : "red"}>{item.active ? "active" : "inactive"}</Pill>
                        <Pill tone="amber">difficulty {item.difficulty}/5</Pill>
                        <Pill tone="blue">{item.transferLevel} transfer</Pill>
                      </div>
                    </div>
                    <p className="mt-4 rounded-2xl bg-[#f6f0e5] p-4 text-sm leading-6 text-[#263632]">{item.prompt}</p>
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-semibold text-[#10211f]">Expected answer</p>
                        <p className="mt-1 text-[#53615c]">{item.expectedAnswer}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#10211f]">Evidence metadata</p>
                        <p className="mt-1 text-[#53615c]">{item.evidenceCategory} · weight {Math.round(item.evidenceWeight)} · v {item.version}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
                      <div className="rounded-2xl border border-[#e4d8c7] bg-white p-3">
                        <p className="mb-2 font-semibold text-[#10211f]">Misconceptions</p>
                        <div className="flex flex-wrap gap-1">{misconceptionIds.length ? misconceptionIds.map((id) => <Pill key={id} tone="red">{id}</Pill>) : <span className="text-[#64716c]">None mapped</span>}</div>
                      </div>
                      <div className="rounded-2xl border border-[#e4d8c7] bg-white p-3">
                        <p className="mb-2 font-semibold text-[#10211f]">Representations</p>
                        <p className="text-[#64716c]">{representations.join(" · ") || "None"}</p>
                      </div>
                      <div className="rounded-2xl border border-[#e4d8c7] bg-white p-3">
                        <p className="mb-2 font-semibold text-[#10211f]">Wrong-answer signal</p>
                        <p className="text-[#64716c]">{wrongAnswers[0]?.misconceptionId ?? wrongAnswers[0]?.answer ?? "Stored in metadata"}</p>
                      </div>
                    </div>
                    <details className="mt-4 rounded-2xl bg-[#f6f0e5] p-3 text-sm">
                      <summary className="cursor-pointer font-semibold">Why this item exists</summary>
                      <p className="mt-2 text-[#53615c]">{rubricPurpose(item.explanationRubric)}</p>
                    </details>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
