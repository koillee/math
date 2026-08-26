import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, Sparkles } from "lucide-react";
import { getTodaysPracticeState } from "@/lib/learning/todays-practice";

export const dynamic = "force-dynamic";

export default async function HaimHome() {
  const state = await getTodaysPracticeState();
  const startHref = state.isCompleted ? `/today?completed=1&sessionId=${state.session.id}` : `/practice?sessionId=${state.session.id}`;
  return <main className="min-h-screen bg-[#f6f0e5] px-4 py-6 text-[#17211f] sm:px-6 sm:py-10">
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.24em] text-[#94652e]">MasteryOS Math</p><h1 className="mt-1 font-serif text-4xl font-semibold">Hi, Haim</h1></div><div className="grid size-12 place-items-center rounded-2xl bg-[#10211f] text-[#d99b4a]"><Sparkles className="size-6" /></div></header>
      <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#10211f] p-7 text-[#f8efe1] shadow-xl sm:p-10">
        <div className="flex items-center gap-2 text-[#d99b4a]"><CalendarDays className="size-5" /><span className="text-sm font-semibold">Today’s maths</span></div>
        <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight">{state.isCompleted ? "Your five questions are done." : "Five questions are ready for you."}</h2>
        <p className="mt-4 max-w-lg text-lg leading-7 text-[#d8cdbb]">{state.isCompleted ? "Look through your answers, or choose another short set if you would like more practice." : "One question at a time. Take your time and explain your thinking if you can."}</p>
        <Link href={startHref} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d99b4a] px-6 py-4 text-lg font-semibold text-[#10211f] transition hover:bg-[#e7ad60]">{state.isCompleted ? "See today’s answers" : "Start my five questions"}<ArrowRight className="size-5" /></Link>
      </section>
      <section className="mt-6 rounded-[1.5rem] border border-[#cfded7] bg-[#f7fbf7] p-6"><div className="flex items-start gap-3"><BookOpenCheck className="mt-1 size-6 text-[#2f6173]" /><div><h2 className="text-xl font-semibold">A little maths every day</h2><p className="mt-2 leading-6 text-[#53615c]">Today’s questions are chosen from the ideas you are practising and the things worth remembering. A wrong answer is useful — it tells us what to work on next.</p></div></div></section>
      <p className="mt-10 text-center text-sm text-[#64716c]">You only need to do five. Extra practice is always your choice.</p>
    </div>
  </main>;
}