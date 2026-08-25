"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getActiveDiagnosticItems } from "@/lib/learning/assessment";
import { processDiagnosticSubmission } from "@/lib/learning/process";
import { ensureSeedData } from "@/lib/learning/seed";

function confidenceNumber(value: FormDataEntryValue | null) {
  const n = Number(value ?? 3);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3;
}

export async function submitDiagnostic(formData: FormData) {
  await ensureSeedData();
  const diagnosticItems = await getActiveDiagnosticItems();
  const attemptId = String(formData.get("attemptId") ?? "").trim() || undefined;
  const submission: Record<string, { answer: string; explanation: string; representation: string; confidence: number; timeOnTaskSeconds: number }> = {};
  for (const item of diagnosticItems) {
    submission[item.id] = {
      answer: String(formData.get(`${item.id}_answer`) ?? ""),
      explanation: String(formData.get(`${item.id}_explanation`) ?? ""),
      representation: String(formData.get(`${item.id}_representation`) ?? "none"),
      confidence: confidenceNumber(formData.get(`${item.id}_confidence`)),
      timeOnTaskSeconds: Number(formData.get(`${item.id}_time`) ?? 45) || 45,
    };
  }
  await processDiagnosticSubmission(submission, { attemptId });
  revalidatePath("/");
  revalidatePath("/mastery");
  revalidatePath("/tutor");
  revalidatePath("/parent-report");
  revalidatePath("/evidence");
  revalidatePath("/timeline");
  redirect("/tutor?submitted=1");
}

export async function resetMvpData() {
  const student = await ensureSeedData();
  await prisma.evidenceEvent.deleteMany({ where: { studentId: student.id } });
  await prisma.studentMisconception.deleteMany({ where: { studentId: student.id } });
  await prisma.studentRecommendation.deleteMany({ where: { studentId: student.id } });
  await prisma.parentReport.deleteMany({ where: { studentId: student.id } });
  await prisma.studentMastery.updateMany({
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
  });
  revalidatePath("/");
  redirect("/");
}
