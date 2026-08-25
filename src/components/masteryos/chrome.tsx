import Link from "next/link";
import { Brain, CalendarCheck, ClipboardCheck, Database, FileText, Gauge, History, Home, LibraryBig, MessageSquareText, RefreshCw, Route } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  ["/", "Dashboard", Home],
  ["/today", "Today", CalendarCheck],
  ["/diagnostic", "Diagnostic", ClipboardCheck],
  ["/next", "Next Action", Route],
  ["/retention", "Retention", RefreshCw],
  ["/items", "Item Bank", LibraryBig],
  ["/mastery", "Mastery", Gauge],
  ["/timeline", "Timeline", History],
  ["/tutor", "Tutor", MessageSquareText],
  ["/parent-report", "Parent Report", FileText],
  ["/evidence", "Evidence", Database],
] as const;

export function AppShell({ children, active }: { children: React.ReactNode; active?: string }) {
  return (
    <main className="min-h-screen bg-[#f6f0e5] text-[#17211f]">
      <div className="pointer-events-none fixed inset-0 opacity-70 [background:radial-gradient(circle_at_12%_18%,rgba(62,97,117,.18),transparent_30%),radial-gradient(circle_at_84%_0%,rgba(204,143,65,.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,.7),transparent)]" />
      <div className="relative mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 md:px-8">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-72 shrink-0 rounded-[2rem] border border-[#d8cdbb] bg-[#10211f] p-5 text-[#f8efe1] shadow-2xl shadow-[#10211f]/20 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]"><Brain className="size-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#d9c8aa]">MasteryOS</p>
              <h1 className="font-serif text-2xl font-semibold">Math MVP</h1>
            </div>
          </div>
          <nav className="space-y-2">
            {nav.map(([href, label, Icon]) => (
              <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#e5d8c2] transition hover:bg-white/10", active === href && "bg-[#f6f0e5] text-[#10211f]")}> <Icon className="size-4" /> {label}</Link>
            ))}
          </nav>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[#d8cdbb]">
            <p className="font-medium text-[#f8efe1]">Core loop</p>
            <p>diagnose → infer → personalize → explain → report</p>
          </div>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 rounded-[2rem] border border-[#dfd3c0] bg-white/70 p-6 shadow-sm backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#94652e]">{eyebrow}</p>
      <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#10211f] md:text-5xl">{title}</h2>
      {children && <div className="mt-4 max-w-3xl text-[#53615c]">{children}</div>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[1.5rem] border border-[#dfd3c0] bg-white/75 p-5 shadow-sm backdrop-blur", className)}>{children}</div>;
}

export function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "amber" | "green" | "red" | "ink" }) {
  const tones = {
    blue: "bg-[#dceaf0] text-[#24495a]",
    amber: "bg-[#f4dfbd] text-[#754714]",
    green: "bg-[#dfe9d6] text-[#36582e]",
    red: "bg-[#f2d9d3] text-[#7f3526]",
    ink: "bg-[#10211f] text-[#f8efe1]",
  };
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function Meter({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[#64716c]"><span>{label}</span><span>{Math.round(value)}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5dccd]"><div className="h-full rounded-full bg-[#2f6173]" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></div>
    </div>
  );
}
