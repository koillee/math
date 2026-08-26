import { NextResponse } from "next/server";
import { createExtraPracticeSession } from "@/lib/learning/todays-practice";

export async function POST() {
  try {
    const session = await createExtraPracticeSession();
    if (!session) throw new Error("Extra session could not be created");
    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (error) {
    console.error("Extra practice creation failed", error);
    return NextResponse.json({ error: "The extra practice set could not be prepared. Please try again." }, { status: 500 });
  }
}