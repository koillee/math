import type { Student } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dependencies, misconceptions, MVP_STUDENT, skillNodes } from "./data";
import { itemBankSeeds } from "./item-bank";

let seedDataPromise: Promise<Student> | null = null;

async function seedData() {
  for (const [skillNodeId, domain, strand, skill, subskill, microSkill, nodeType, masteryRole, criticality, stage, evidenceType] of skillNodes) {
    await prisma.skillGraph.upsert({
      where: { skillNodeId },
      create: { skillNodeId, domain, strand, skill, subskill, microSkill, nodeType, masteryRole, criticality, stage, evidenceType, version: "v3-multi-domain", active: true },
      update: { domain, strand, skill, subskill, microSkill, nodeType, masteryRole, criticality, stage, evidenceType, version: "v3-multi-domain", active: true },
    });
  }

  const existingDependencies = new Set(
    (
      await prisma.dependencyGraph.findMany({
        select: { sourceNodeId: true, targetNodeId: true, relationshipType: true },
      })
    ).map((edge) => `${edge.sourceNodeId}->${edge.targetNodeId}:${edge.relationshipType}`)
  );
  const missingDependencies = dependencies
    .filter(([sourceNodeId, targetNodeId]) => !existingDependencies.has(`${sourceNodeId}->${targetNodeId}:PREREQUISITE_OF`))
    .map(([sourceNodeId, targetNodeId]) => ({
      sourceNodeId,
      targetNodeId,
      relationshipType: "PREREQUISITE_OF",
      logic: "ALL",
      criticality: "Core",
      edgeWeight: 1,
      version: "v3-multi-domain",
      active: true,
    }));
  if (missingDependencies.length > 0) {
    await prisma.dependencyGraph.createMany({
      data: missingDependencies,
    });
  }

  for (const [misconceptionId, name, domain, relatedSkillIds, description, typicalStudentThinking, diagnosticSignals, rootCause, frequency, severity, persistence, futureRisks] of misconceptions) {
    await prisma.misconceptionFramework.upsert({
      where: { misconceptionId },
      create: { misconceptionId, name, domain, relatedSkillIds: relatedSkillIds as unknown as string[], description, typicalStudentThinking, diagnosticSignals: diagnosticSignals as unknown as string[], rootCause, frequency, severity, persistence, futureRisks: futureRisks as unknown as string[], version: "v2-multi-domain", active: true },
      update: { name, domain, relatedSkillIds: relatedSkillIds as unknown as string[], description, typicalStudentThinking, diagnosticSignals: diagnosticSignals as unknown as string[], rootCause, frequency, severity, persistence, futureRisks: futureRisks as unknown as string[], version: "v2-multi-domain", active: true },
    });
  }

  for (const item of itemBankSeeds) {
    await prisma.mathItem.upsert({
      where: { itemId: item.itemId },
      create: item,
      update: item,
    });
  }

  let student = await prisma.student.findFirst({ where: { name: MVP_STUDENT.name } });
  if (!student) {
    const legacyStudent = await prisma.student.findFirst({ where: { name: "Alex" }, orderBy: { createdAt: "asc" } });
    student = legacyStudent
      ? await prisma.student.update({ where: { id: legacyStudent.id }, data: MVP_STUDENT })
      : await prisma.student.create({ data: MVP_STUDENT });
  } else {
    student = await prisma.student.update({ where: { id: student.id }, data: MVP_STUDENT });
  }

  await prisma.studentMastery.createMany({
    data: skillNodes.map(([skillNodeId]) => ({
      studentId: student.id,
      skillNodeId,
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
    })),
    skipDuplicates: true,
  });

  return student;
}

export async function ensureSeedData() {
  seedDataPromise ??= seedData();
  try {
    return await seedDataPromise;
  } catch (error) {
    seedDataPromise = null;
    throw error;
  }
}
