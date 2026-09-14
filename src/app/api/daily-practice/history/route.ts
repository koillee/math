import { prisma } from "@/lib/db";
import {
  normalizePracticeRecords,
  normalizeReflectionMission,
  selectMoreCompleteReflection,
} from "@/lib/learning/practice-history";
import type { DailyPracticeRecord } from "@/lib/learning/practice-progress";
import { ensureSeedData } from "@/lib/learning/seed";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const responseHeaders = { "Cache-Control": "private, no-store" };

type StoredSession = Prisma.SimplePracticeSessionGetPayload<{
  include: { items: true };
}>;

function serializeSession(session: StoredSession): DailyPracticeRecord {
  return {
    id: session.clientRecordId,
    date: session.practiceDate,
    completedAt: session.completedAt.toISOString(),
    topic: session.topic as DailyPracticeRecord["topic"],
    lessonTitle: session.lessonTitle,
    total: session.total,
    correct: session.correct,
    firstTryCorrect: session.firstTryCorrect,
    needsReview: session.needsReview as DailyPracticeRecord["needsReview"],
    reflectionMission: normalizeReflectionMission(session.reflectionMission),
    items: session.items
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.questionId,
        topic: item.topic as DailyPracticeRecord["topic"],
        skillId:
          item.skillId as DailyPracticeRecord["items"][number]["skillId"],
        skillName: item.skillName ?? undefined,
        label: item.label,
        prompt: item.prompt,
        answer: item.expectedAnswer,
        selected: item.selectedAnswer,
        correct: item.correct,
        attempts: item.attempts,
        difficulty:
          item.difficulty as DailyPracticeRecord["items"][number]["difficulty"],
        feedback:
          item.feedback as DailyPracticeRecord["items"][number]["feedback"],
      })),
  };
}

function serializeReflection(value: DailyPracticeRecord["reflectionMission"]) {
  return value as Prisma.InputJsonValue | undefined;
}

function createAttempts(record: DailyPracticeRecord) {
  return record.items.map((item, position) => ({
    questionId: item.id,
    position,
    topic: item.topic,
    skillId: item.skillId,
    skillName: item.skillName,
    label: item.label,
    prompt: item.prompt,
    expectedAnswer: item.answer,
    selectedAnswer: item.selected,
    correct: item.correct,
    attempts: item.attempts,
    difficulty: item.difficulty,
    feedback: item.feedback,
  }));
}

async function saveRecord(
  transaction: Prisma.TransactionClient,
  studentId: string,
  record: DailyPracticeRecord,
) {
  const where = {
    studentId_clientRecordId: {
      studentId,
      clientRecordId: record.id,
    },
  };
  const existing = await transaction.simplePracticeSession.findUnique({
    where,
  });
  const reflectionMission = selectMoreCompleteReflection(
    existing?.reflectionMission,
    record.reflectionMission,
  );
  const completedAt = new Date(record.completedAt);

  if (!existing) {
    await transaction.simplePracticeSession.create({
      data: {
        studentId,
        clientRecordId: record.id,
        practiceDate: record.date,
        topic: record.topic,
        lessonTitle: record.lessonTitle,
        total: record.total,
        correct: record.correct,
        firstTryCorrect: record.firstTryCorrect,
        needsReview: record.needsReview,
        reflectionMission: serializeReflection(reflectionMission),
        completedAt,
        items: { create: createAttempts(record) },
      },
    });
    return;
  }

  const incomingCoreIsCurrent = completedAt >= existing.completedAt;
  await transaction.simplePracticeSession.update({
    where,
    data: {
      ...(incomingCoreIsCurrent
        ? {
            practiceDate: record.date,
            topic: record.topic,
            lessonTitle: record.lessonTitle,
            total: record.total,
            correct: record.correct,
            firstTryCorrect: record.firstTryCorrect,
            needsReview: record.needsReview,
            completedAt,
            items: {
              deleteMany: {},
              create: createAttempts(record),
            },
          }
        : {}),
      ...(reflectionMission
        ? { reflectionMission: serializeReflection(reflectionMission) }
        : {}),
    },
  });
}

async function loadHistory(studentId: string) {
  const sessions = await prisma.simplePracticeSession.findMany({
    where: { studentId },
    include: { items: true },
    orderBy: { completedAt: "desc" },
    take: 200,
  });
  return sessions.map(serializeSession);
}

export async function GET() {
  try {
    const student = await ensureSeedData();
    return NextResponse.json(
      { records: await loadHistory(student.id) },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("Daily practice history could not be loaded", error);
    return NextResponse.json(
      { error: "Practice history could not be loaded." },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "JSON is required." },
        { status: 415, headers: responseHeaders },
      );
    }
    const body = (await request.json()) as { records?: unknown };
    const records = normalizePracticeRecords(body.records, 50);
    if (!records.length) {
      return NextResponse.json(
        { error: "No valid practice records were supplied." },
        { status: 400, headers: responseHeaders },
      );
    }

    const student = await ensureSeedData();
    await prisma.$transaction(async (transaction) => {
      for (const record of records) {
        await saveRecord(transaction, student.id, record);
      }
    });

    return NextResponse.json(
      { records: await loadHistory(student.id) },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("Daily practice history could not be saved", error);
    return NextResponse.json(
      { error: "Practice history could not be saved." },
      { status: 500, headers: responseHeaders },
    );
  }
}
