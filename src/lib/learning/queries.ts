import { prisma } from "@/lib/db";
import { ensureSeedData } from "./seed";

export async function getMvpState() {
  const student = await ensureSeedData();
  // These are independent read queries. Running them concurrently avoids making
  // every page wait for six database round trips in sequence on iPad/Vercel.
  const [mastery, misconceptions, recommendations, evidenceEvents, reports, skills] = await Promise.all([
    prisma.studentMastery.findMany({ where: { studentId: student.id }, include: { skill: true }, orderBy: [{ skillNodeId: "asc" }] }),
    prisma.studentMisconception.findMany({ where: { studentId: student.id }, include: { misconception: true }, orderBy: [{ probability: "desc" }] }),
    prisma.studentRecommendation.findMany({ where: { studentId: student.id }, orderBy: { generatedAt: "desc" }, take: 5 }),
    prisma.evidenceEvent.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 100, include: { skill: true } }),
    prisma.parentReport.findMany({ where: { studentId: student.id }, orderBy: { generatedAt: "desc" }, take: 3 }),
    prisma.skillGraph.findMany({ where: { active: true }, orderBy: { skillNodeId: "asc" } }),
  ]);
  return { student, mastery, misconceptions, recommendations, evidenceEvents, reports, skills };
}
