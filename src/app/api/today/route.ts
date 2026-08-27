import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { processDailyPracticeSubmission, type DailyPracticeSubmission } from "@/lib/learning/process";
import { getPracticeSessionState } from "@/lib/learning/todays-practice";

function clampConfidence(value: unknown) {
  const n = Number(value ?? 3);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3;
}

function cleanText(value: unknown, maxLength = 1200) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: unknown; attemptId?: unknown; submission?: Record<string, Partial<DailyPracticeSubmission[string]>> };
    const sessionId = cleanText(body.sessionId, 120);
    const attemptId = cleanText(body.attemptId, 180) || undefined;
    const state = sessionId ? await getPracticeSessionState(sessionId) : null;
    if (!state || state.isCompleted) return NextResponse.json({ error: "This practice set is not available. Please return to Today and try again." }, { status: 400 });

    const incoming = body.submission ?? {};
    const submission: DailyPracticeSubmission = {};
    const missingAnswers: string[] = [];

    for (const practiceItem of state.items) {
      const input = incoming[practiceItem.itemId] ?? {};
      const answer = cleanText(input.answer);
      if (!answer) missingAnswers.push(practiceItem.item.title);
      submission[practiceItem.itemId] = {
        answer,
        explanation: cleanText(input.explanation, 1800),
        representation: cleanText(input.representation, 120) || "none",
        confidence: clampConfidence(input.confidence),
        timeOnTaskSeconds: Math.max(5, Math.min(900, Number(input.timeOnTaskSeconds ?? 45) || 45)),
      };
    }

    if (missingAnswers.length > 0) {
      return NextResponse.json({ error: "Please answer every practice problem before submitting today's practice.", missingAnswers }, { status: 400 });
    }

    const result = await processDailyPracticeSubmission(sessionId, submission, { attemptId });
    for (const path of ["/", "/today", "/next", "/retention", "/diagnostic", "/mastery", "/timeline", "/tutor", "/parent-report", "/evidence", "/items"]) revalidatePath(path);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Today's practice submission failed", error);
    return NextResponse.json({ error: "Today's practice could not be saved. Please try again in a moment." }, { status: 500 });
  }
}
