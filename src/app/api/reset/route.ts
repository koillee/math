import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/learning/seed";

export async function POST() {
  try {
    const student = await ensureSeedData();
    await prisma.$transaction([
      prisma.dailyPracticeSession.deleteMany({ where: { studentId: student.id } }),
      prisma.evidenceEvent.deleteMany({ where: { studentId: student.id } }),
      prisma.studentMisconception.deleteMany({ where: { studentId: student.id } }),
      prisma.studentRecommendation.deleteMany({ where: { studentId: student.id } }),
      prisma.parentReport.deleteMany({ where: { studentId: student.id } }),
      prisma.studentMastery.updateMany({
        where: { studentId: student.id },
        data: {
          masteryLevel: 1,
          aiState: "Not Learned",
          accuracyScore: 20,
          fluencyScore: 20,
          representationScore: 20,
          explanationScore: 20,
          transferScore: 10,
          retentionScore: 50,
          hintIndependenceScore: 80,
          confidenceCalibrationScore: 50,
          misconceptionRiskScore: 0,
          evidenceCount: 0,
          evidenceDiversity: 0,
          modelConfidence: 25,
          whyThisStatus: "Waiting for diagnostic evidence.",
          lastEvidenceAt: null,
          nextReviewDueAt: null,
        },
      }),
    ]);
    for (const path of ["/", "/today", "/diagnostic", "/next", "/retention", "/mastery", "/timeline", "/tutor", "/parent-report", "/evidence", "/items"]) revalidatePath(path);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MVP reset failed", error);
    return NextResponse.json({ error: "MVP evidence could not be reset. Please try again." }, { status: 500 });
  }
}