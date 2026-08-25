import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getActiveDiagnosticItems } from "@/lib/learning/assessment";
import { processDiagnosticSubmission, type DiagnosticSubmission } from "@/lib/learning/process";
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
    const diagnosticItems = await getActiveDiagnosticItems();
    const body = (await request.json()) as { attemptId?: unknown; submission?: Record<string, Partial<DiagnosticSubmission[string]>> };
    const attemptId = cleanText(body.attemptId, 120) || undefined;
    const incoming = body.submission ?? {};
    const missingAnswers: string[] = [];
    const submission: DiagnosticSubmission = {};

    for (const item of diagnosticItems) {
      const input = incoming[item.id] ?? {};
      const answer = cleanText(input.answer);
      if (!answer) missingAnswers.push(item.id);
      submission[item.id] = {
        answer,
        explanation: cleanText(input.explanation, 1800),
        representation: cleanText(input.representation, 120) || "none",
        confidence: clampConfidence(input.confidence),
        timeOnTaskSeconds: Math.max(5, Math.min(900, Number(input.timeOnTaskSeconds ?? 45) || 45)),
      };
    }

    if (missingAnswers.length > 0) {
      return NextResponse.json({ error: "Please answer every diagnostic item before updating the learning profile.", missingAnswers }, { status: 400 });
    }

    const result = await processDiagnosticSubmission(submission, { attemptId });
    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/diagnostic");
    revalidatePath("/next");
    revalidatePath("/retention");
    revalidatePath("/mastery");
    revalidatePath("/tutor");
    revalidatePath("/parent-report");
    revalidatePath("/evidence");
    revalidatePath("/timeline");
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Diagnostic submission failed", error);
    return NextResponse.json({ error: "The diagnostic could not be saved. Please try again in a moment." }, { status: 500 });
  }
}