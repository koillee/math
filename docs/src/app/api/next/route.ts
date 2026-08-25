import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { processNextActionSubmission, type LearningActivitySubmission } from "@/lib/learning/process";
import { ensureSeedData } from "@/lib/learning/seed";

function clampConfidence(value: unknown) {
  const n = Number(value ?? 3);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3;
}

function cleanText(value: unknown, maxLength = 1200) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const body = (await request.json()) as { attemptId?: unknown; itemId?: unknown; activityType?: unknown; submission?: Partial<LearningActivitySubmission> };
    const itemId = cleanText(body.itemId, 120);
    const attemptId = cleanText(body.attemptId, 160) || undefined;
    const activityType = cleanText(body.activityType, 80).toLowerCase();
    const eventType = activityType === "retention" ? "Retention Practice" : "Next Best Action";
    const incoming = body.submission ?? {};
    const answer = cleanText(incoming.answer);

    if (!itemId) return NextResponse.json({ error: "No next activity item was selected." }, { status: 400 });
    if (!answer) return NextResponse.json({ error: "Please answer the next activity before updating the learning profile." }, { status: 400 });

    const submission: LearningActivitySubmission = {
      answer,
      explanation: cleanText(incoming.explanation, 1800),
      representation: cleanText(incoming.representation, 120) || "none",
      confidence: clampConfidence(incoming.confidence),
      timeOnTaskSeconds: Math.max(5, Math.min(900, Number(incoming.timeOnTaskSeconds ?? 45) || 45)),
    };

    const result = await processNextActionSubmission(itemId, submission, { attemptId, eventType });
    for (const path of ["/", "/today", "/next", "/retention", "/diagnostic", "/mastery", "/timeline", "/tutor", "/parent-report", "/evidence", "/items"]) revalidatePath(path);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Next activity submission failed", error);
    return NextResponse.json({ error: "The next activity could not be saved. Please try again in a moment." }, { status: 500 });
  }
}
