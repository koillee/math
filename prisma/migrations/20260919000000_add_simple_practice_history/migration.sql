-- Additive storage for the simplified Daily Practice and reflection pilot.
BEGIN;
CREATE TABLE "SimplePracticeSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "clientRecordId" TEXT NOT NULL,
    "practiceDate" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "lessonTitle" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "firstTryCorrect" INTEGER NOT NULL,
    "needsReview" JSONB NOT NULL,
    "reflectionMission" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SimplePracticeSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SimplePracticeAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "skillId" TEXT,
    "skillName" TEXT,
    "label" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "firstWrongAnswer" TEXT,
    "hintUsed" BOOLEAN,
    "correct" BOOLEAN NOT NULL,
    "attempts" INTEGER NOT NULL,
    "difficulty" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimplePracticeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SimplePracticeSession_studentId_completedAt_idx"
    ON "SimplePracticeSession"("studentId", "completedAt");
CREATE INDEX "SimplePracticeSession_studentId_practiceDate_idx"
    ON "SimplePracticeSession"("studentId", "practiceDate");
CREATE INDEX "SimplePracticeSession_studentId_topic_idx"
    ON "SimplePracticeSession"("studentId", "topic");
CREATE UNIQUE INDEX "SimplePracticeSession_studentId_clientRecordId_key"
    ON "SimplePracticeSession"("studentId", "clientRecordId");
CREATE INDEX "SimplePracticeAttempt_sessionId_idx"
    ON "SimplePracticeAttempt"("sessionId");
CREATE INDEX "SimplePracticeAttempt_skillId_idx"
    ON "SimplePracticeAttempt"("skillId");
CREATE INDEX "SimplePracticeAttempt_topic_idx"
    ON "SimplePracticeAttempt"("topic");
CREATE UNIQUE INDEX "SimplePracticeAttempt_sessionId_position_key"
    ON "SimplePracticeAttempt"("sessionId", "position");

ALTER TABLE "SimplePracticeSession"
    ADD CONSTRAINT "SimplePracticeSession_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimplePracticeAttempt"
    ADD CONSTRAINT "SimplePracticeAttempt_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "SimplePracticeSession"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
