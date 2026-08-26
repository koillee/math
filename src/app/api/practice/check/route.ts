import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gradeItemBankItem } from "@/lib/learning/engine";

function cleanText(value: unknown, maxLength = 1800) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { itemId?: unknown; answer?: unknown; explanation?: unknown; representation?: unknown; confidence?: unknown };
    const itemId = cleanText(body.itemId, 120);
    const answer = cleanText(body.answer);
    if (!itemId || !answer) return NextResponse.json({ error: "Type an answer first, then check it." }, { status: 400 });
    const item = await prisma.mathItem.findUnique({ where: { itemId } });
    if (!item || !item.active) return NextResponse.json({ error: "That practice question is not available. Please return to Today and try again." }, { status: 404 });
    const confidence = Math.max(1, Math.min(5, Number(body.confidence ?? 3) || 3));
    const grade = gradeItemBankItem(item, answer, cleanText(body.explanation), confidence, cleanText(body.representation, 120) || "none");
    return NextResponse.json({
      ok: true,
      correct: grade.correctness === 100,
      expectedAnswer: item.expectedAnswer,
      feedback: grade.correctness === 100 ? "Correct — well done. Read the explanation once, then move to the next question." : grade.feedback.replace("This activity", "This answer"),
    });
  } catch (error) {
    console.error("Practice answer check failed", error);
    return NextResponse.json({ error: "I could not check that answer just now. Please try again." }, { status: 500 });
  }
}