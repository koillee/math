import { prisma } from "@/lib/db";
import { ensureSeedData } from "./seed";

export async function getMvpState() {
  const student = await ensureSeedData();
  const [mastery, misconceptions, recommendations, evidenceEvents, reports, skills] = await prisma.$transaction([
    prisma.studentMastery.findMany({ where: { studentId: student.id }, include: { skill: true }, orderBy: [{ skillNodeId: "asc" }] }),
    prisma.studentMisconception.findMany({ where: { studentId: student.id }, include: { misconception: true }, orderBy: [{ probability: "desc" }] }),
    prisma.studentRecommendation.findMany({ where: { studentId: student.id }, orderBy: { generatedAt: "desc" }, take: 5 }),
    prisma.evidenceEvent.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 100, include: { skill: true } }),
    prisma.parentReport.findMany({ where: { studentId: student.id }, orderBy: { generatedAt: "desc" }, take: 3 }),
    prisma.skillGraph.findMany({ where: { active: true }, orderBy: { skillNodeId: "asc" } }),
  ]);
  return { student, mastery, misconceptions, recommendations, evidenceEvents, reports, skills };
}
