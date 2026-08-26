import { redirect } from "next/navigation";
import { PracticeFlow } from "./PracticeFlow";
import { getPracticeSessionState, getTodaysPracticeState } from "@/lib/learning/todays-practice";

export const dynamic = "force-dynamic";

export default async function PracticePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : undefined;
  const state = sessionId ? await getPracticeSessionState(sessionId) : await getTodaysPracticeState();
  if (!state) redirect("/");
  if (state.isCompleted) redirect(`/today?completed=1&sessionId=${state.session.id}`);
  return <PracticeFlow sessionId={state.session.id} practiceDate={state.session.practiceDate} items={state.items.map((item) => ({ itemId: item.itemId, position: item.position, item: item.item }))} />;
}