import Link from "next/link";
import { ArrowRight, BarChart3, Brain, FileText, LibraryBig } from "lucide-react";
import { AppShell, Card, PageHeader, Pill } from "@/components/masteryos/chrome";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const { mastery, evidenceEvents, recommendations } = await getMvpState();
  const assessed = mastery.filter((item) => item.evidenceCount > 0).length;
  return <AppShell active="/owner"><PageHeader eyebrow="Owner workspace" title="Learning engine overview"><p>This is the detailed workspace for reviewing the system. Haim’s iPad home now opens to her focused daily practice instead.</p></PageHeader>
    <div className="grid gap-5 md:grid-cols-3"><Card><p className="text-sm text-[#64716c]">Assessed skills</p><h3 className="mt-2 text-3xl font-semibold">{assessed}</h3><p className="mt-1 text-sm text-[#64716c]">of {mastery.length} graph nodes</p></Card><Card><p className="text-sm text-[#64716c]">Evidence events</p><h3 className="mt-2 text-3xl font-semibold">{evidenceEvents.length}</h3><p className="mt-1 text-sm text-[#64716c]">most recent signals</p></Card><Card><p className="text-sm text-[#64716c]">Current engine action</p><h3 className="mt-2 text-xl font-semibold">{recommendations[0]?.recommendedAction ?? "Diagnostic needed"}</h3><Pill tone="amber">Engine view</Pill></Card></div>
    <div className="mt-5 grid gap-5 md:grid-cols-3"><Link href="/mastery" className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold shadow-sm"><BarChart3 className="size-5 text-[#2f6173]" /> <p className="mt-4">Mastery and retention</p><ArrowRight className="mt-3 size-5" /></Link><Link href="/items" className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold shadow-sm"><LibraryBig className="size-5 text-[#2f6173]" /> <p className="mt-4">Item bank</p><ArrowRight className="mt-3 size-5" /></Link><Link href="/evidence" className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 font-semibold shadow-sm"><Brain className="size-5 text-[#2f6173]" /> <p className="mt-4">Evidence and engine detail</p><ArrowRight className="mt-3 size-5" /></Link></div>
    <Link href="/parent-report" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"><FileText className="size-4" /> Open parent report</Link>
  </AppShell>;
}