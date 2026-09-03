import {
  ArrowRight,
  BookOpenCheck,
  Calculator,
  CalendarDays,
  MapIcon,
  NotebookTabs,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function HaimHome() {
  return (
    <main className="min-h-screen bg-[#f6f0e5] px-4 py-6 text-[#17211f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#94652e]">
              MasteryOS Math
            </p>
            <h1 className="mt-1 font-serif text-4xl font-semibold">Hi, Haim</h1>
          </div>
          <div className="grid size-12 place-items-center rounded-2xl bg-[#10211f] text-[#d99b4a]">
            <Sparkles className="size-6" />
          </div>
        </header>
        <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#10211f] p-7 text-[#f8efe1] shadow-xl sm:p-10">
          <div className="flex items-center gap-2 text-[#d99b4a]">
            <CalendarDays className="size-5" />
            <span className="text-sm font-semibold">Today’s maths</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <p className="inline-flex rounded-full bg-[#d99b4a] px-4 py-2 text-sm font-bold text-[#10211f]">
              15-minute rhythm
            </p>
            <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#f2d8b0]">
              Teach, practise, review
            </p>
          </div>
          <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight">
            Learn one idea, then try a few.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-7 text-[#d8cdbb]">
            Start with a short mixed practice set, then use Lessons or 구구단
            when Haim needs more teaching or recall practice.
          </p>
          <Link
            href="/daily-practice"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d99b4a] px-6 py-4 text-lg font-semibold text-[#10211f] transition hover:bg-[#e7ad60]"
          >
            Start daily practice
            <ArrowRight className="size-5" />
          </Link>
        </section>
        <section className="mt-6 rounded-[1.5rem] border border-[#cfded7] bg-[#f7fbf7] p-6">
          <div className="flex items-start gap-3">
            <BookOpenCheck className="mt-1 size-6 text-[#2f6173]" />
            <div>
              <h2 className="text-xl font-semibold">Learn → try → review</h2>
              <p className="mt-2 leading-6 text-[#53615c]">
                Today starts with a short mini lesson and worked example. Then
                you choose answers from options and explain your thinking if you
                can. If an answer is not quite right, the app gives a similar
                retry.
              </p>
            </div>
          </div>
        </section>
        <section className="mt-4 rounded-[1.5rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Calculator className="mt-1 size-6 text-[#2f6173]" />
              <div>
                <h2 className="text-xl font-semibold">구구단 practice</h2>
                <p className="mt-2 leading-6 text-[#53615c]">
                  Build one-digit multiplication recall with mirror facts,
                  useful patterns, and short focused rounds.
                </p>
              </div>
            </div>
            <Link
              href="/gugudan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
            >
              Practise
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
        <section className="mt-4 rounded-[1.5rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MapIcon className="mt-1 size-6 text-[#2f6173]" />
              <div>
                <h2 className="text-xl font-semibold">Math Map</h2>
                <p className="mt-2 leading-6 text-[#53615c]">
                  See the simple Year 6 coverage map: what we are learning now,
                  what comes soon, and what stays in review.
                </p>
              </div>
            </div>
            <Link
              href="/math-map"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
            >
              Open map
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
        <section className="mt-4 rounded-[1.5rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <NotebookTabs className="mt-1 size-6 text-[#2f6173]" />
              <div>
                <h2 className="text-xl font-semibold">Lessons</h2>
                <p className="mt-2 leading-6 text-[#53615c]">
                  Learn multiplication, fractions, decimals, and percentages
                  with simple explanations before practice.
                </p>
              </div>
            </div>
            <Link
              href="/lessons"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
            >
              Start learning
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
        <p className="mt-10 text-center text-sm text-[#64716c]">
          You only need to do five. Extra practice is always your choice.
        </p>
      </div>
    </main>
  );
}
