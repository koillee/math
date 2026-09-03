import { AppShell } from "@/components/masteryos/chrome";
import {
  ArrowRight,
  BookOpenCheck,
  Calculator,
  ChartColumn,
  Compass,
  Diamond,
  Grid3X3,
  MapIcon,
  Percent,
  Ruler,
  Shapes,
  Sigma,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type DomainStatus = "now" | "soon" | "later" | "always";

const statusStyles: Record<DomainStatus, string> = {
  now: "bg-[#dfe9d6] text-[#36582e]",
  soon: "bg-[#dceaf0] text-[#24495a]",
  later: "bg-[#ebe1d1] text-[#53615c]",
  always: "bg-[#f4dfbd] text-[#754714]",
};

const statusLabels: Record<DomainStatus, string> = {
  now: "Learning now",
  soon: "Coming soon",
  later: "Later",
  always: "Mixed in",
};

const domains = [
  {
    title: "Multiplication & Division",
    status: "now",
    icon: Calculator,
    summary:
      "Build fast facts, understand equal groups, use inverse operations, and solve missing-number problems.",
    focus: [
      "구구단 recall",
      "fact families",
      "division meaning",
      "word problems",
    ],
  },
  {
    title: "Fractions",
    status: "now",
    icon: Diamond,
    summary:
      "Understand equal parts, equivalent fractions, comparing fractions, and fractions of amounts.",
    focus: [
      "equal parts",
      "equivalent fractions",
      "unit fractions",
      "fractions of a number",
    ],
  },
  {
    title: "Decimals",
    status: "now",
    icon: Grid3X3,
    summary:
      "Connect decimals to place value, money, measurement, and powers of 10.",
    focus: ["tenths", "hundredths", "comparison", "x10, x100, x1000"],
  },
  {
    title: "Percentages",
    status: "soon",
    icon: Percent,
    summary:
      "Learn percent as out of 100, then connect it to fractions, decimals, discounts, and comparisons.",
    focus: [
      "50%, 25%, 10%",
      "percent of a quantity",
      "discounts",
      "the whole/base",
    ],
  },
  {
    title: "Number & Place Value",
    status: "soon",
    icon: Sigma,
    summary:
      "Read the value of digits, compare and round numbers, and use place-value structure.",
    focus: ["large numbers", "rounding", "expanded form", "negative numbers"],
  },
  {
    title: "Patterns & Algebra Thinking",
    status: "soon",
    icon: Sparkles,
    summary:
      "Spot rules, complete patterns, and use boxes or symbols for unknown values.",
    focus: [
      "rules",
      "missing values",
      "inverse operations",
      "simple equations",
    ],
  },
  {
    title: "Measurement",
    status: "later",
    icon: Ruler,
    summary:
      "Use units, convert measurements, and reason about perimeter, area, volume, time, mass, and capacity.",
    focus: ["unit conversion", "area", "perimeter", "volume"],
  },
  {
    title: "Geometry",
    status: "later",
    icon: Shapes,
    summary:
      "Understand shapes, angles, symmetry, position, movement, and diagrams.",
    focus: ["angles", "properties", "symmetry", "coordinates"],
  },
  {
    title: "Data & Graphs",
    status: "later",
    icon: ChartColumn,
    summary:
      "Read, compare, and explain data using tables, graphs, averages, and probability language.",
    focus: ["charts", "averages", "probability", "data stories"],
  },
  {
    title: "Word Problems & Reasoning",
    status: "always",
    icon: BookOpenCheck,
    summary:
      "Understand the story, choose a strategy, estimate, solve, and check whether the answer makes sense.",
    focus: [
      "read carefully",
      "choose operation",
      "estimate",
      "explain thinking",
    ],
  },
] as const;

export const metadata = {
  title: "Math Map | Haim Math",
  description: "A simple Year 6 maths coverage map for Haim and parents.",
};

export default function MathMapPage() {
  return (
    <AppShell active="/math-map" mode="simple">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-6 text-[#f8efe1] shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d99b4a]">
                Year 6 maths map
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
                See the whole journey.
              </h1>
            </div>
            <div className="grid size-14 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]">
              <MapIcon className="size-7" />
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[#d8cdbb]">
            This is a simple parent-and-child view of the maths areas we want
            Haim to grow through. The first goal is confidence with number,
            multiplication, division, fractions, decimals, and percentages.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Now", "Multiplication, fractions, decimals"],
              ["Soon", "Percentages, patterns, place value"],
              ["Later", "Measurement, geometry, data"],
              ["Always", "Word problems and reasoning"],
            ].map(([label, copy]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4">
                <p className="text-xl font-semibold text-[#d99b4a]">{label}</p>
                <p className="mt-1 text-sm leading-5 text-[#d8cdbb]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {domains.map((domain) => {
            const Icon = domain.icon;
            return (
              <article
                key={domain.title}
                className="rounded-[1.5rem] border border-[#dfd3c0] bg-white/80 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#dceaf0] text-[#24495a]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{domain.title}</h2>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[domain.status]
                        }`}
                      >
                        {statusLabels[domain.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 leading-6 text-[#53615c]">
                  {domain.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {domain.focus.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#f7fbf7] px-3 py-1 text-xs font-semibold text-[#41504b]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-[1.5rem] border border-[#cfded7] bg-[#f7fbf7] p-6">
          <div className="flex items-start gap-3">
            <Compass className="mt-1 size-6 text-[#2f6173]" />
            <div>
              <h2 className="text-xl font-semibold">How we use this map</h2>
              <p className="mt-2 leading-6 text-[#53615c]">
                The daily tutor should teach one small idea at a time. 구구단
                practice builds speed underneath, while the main lessons build
                meaning, explanation, and problem-solving confidence.
              </p>
              <Link
                href="/lessons"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
              >
                Open lessons
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
