# Structured Item Bank v1

## Overview
Structured Item Bank v1 replaces diagnostic questions as hard-coded UI data with a persistent, metadata-rich Year 6 mathematics item bank. The bank is intentionally small in Sprint B, but it establishes the reusable academic infrastructure for diagnostics, review, retention checks, misconception repair, transfer challenges, explanation prompts, and future daily math planning.

## Goals
- Create a scalable item model for Year 6 Fractions, Decimals & Percentages (FDP) without redesigning the curriculum.
- Preserve the current diagnostic experience and scoring quality while sourcing diagnostic items from the item bank.
- Seed 30–50 high-quality FDP items with a clear reason to exist.
- Make item metadata inspectable by parent/tutor/developer users at `/items`.
- Keep correctness, explanation, representation, transfer, misconception, and retention evidence as first-class signals.

## Scope / non-goals
In scope:
- Persistent item-bank data model.
- Seeded FDP item data mapped to existing skill IDs and misconception IDs.
- Diagnostic refactor to read active Diagnostic items from the item bank.
- `/items` browser page with grouping/filter-style visibility by type/domain/skill metadata.
- Smoke and browser QA updates.

Out of scope:
- No curriculum redesign.
- No new lesson system.
- No worksheet generator or printable/PDF daily pages.
- No expansion to other subjects or grades.
- No adaptive item-selection algorithm beyond loading the current active diagnostic set.

## User flows / UX / design notes
- Parent/tutor opens `/items` and sees the size and shape of the current Year 6 FDP bank.
- Items are grouped by item type and show skill, misconception mapping, difficulty, transfer level, evidence category, evidence weight, version, and active state.
- Student opens `/diagnostic`; the diagnostic appears the same as before, but items are loaded from active item-bank records.
- Developer can trace each diagnostic evidence event back to item-bank metadata through the stored prompt, skill node, evidence category, and item ID where available.

## Functional requirements
- Each item must support: `itemId`, `subject`, `yearGroup`, `domain`, `strand`, `skillNodeId`, `title`, `itemType`, `difficulty`, `prompt`, `expectedAnswer`, `acceptedAnswers`, `commonWrongAnswers`, `misconceptionIds`, `explanationRubric`, `representationOptions`, `transferLevel`, `evidenceCategory`, `evidenceWeight`, `active`, and `version`.
- The current FDP diagnostic must use active item-bank records with `itemType = Diagnostic`.
- Existing diagnostic item IDs (`q1`–`q10`) should be preserved to keep current scoring rules and smoke tests stable.
- Non-diagnostic item types must be seeded for review, retention, repair, transfer, explanation, and challenge use cases.
- Item seeding must be idempotent.
- `/items` must be read-only in Sprint B.

## Data model / schema
Preferred Sprint B model: a Prisma `MathItem` table.

Key fields:
- `itemId` primary key.
- Academic identity: `subject`, `yearGroup`, `domain`, `strand`, `skillNodeId`.
- User-facing content: `title`, `prompt`, `expectedAnswer`, `placeholder`.
- Item purpose: `itemType`, `difficulty`, `transferLevel`, `evidenceCategory`, `evidenceWeight`.
- Evidence metadata: `acceptedAnswers`, `commonWrongAnswers`, `misconceptionIds`, `explanationRubric`, `representationOptions` stored as JSON for flexible future authoring.
- Lifecycle: `active`, `version`, `createdAt`, `updatedAt`.

Evidence events may optionally store `itemId` for future traceability while preserving existing events with a nullable value.

## API contracts
No public write API is required in Sprint B.

Internal contracts:
- `getActiveDiagnosticItems()` returns active diagnostic-ready item objects sorted in deterministic order.
- `getItemBankItems()` returns all seeded item-bank records with skill metadata for `/items`.
- `processDiagnosticSubmission(submission, { attemptId })` uses active diagnostic items rather than importing hard-coded diagnostic UI data.

Existing external contract remains:
- `POST /api/diagnostic` accepts `{ attemptId, submission }` and returns `{ ok: true, result }` or `{ error }`.

## Edge cases / failure modes
- If an active diagnostic item is missing a student response, the API must return the existing “answer every diagnostic item” validation error.
- If item-bank seed data changes, old evidence events must remain readable because evidence stores prompt, response, skill, category, and optional `itemId`.
- If no item-bank rows exist, `ensureSeedData()` should recreate the seed bank before pages query it.
- Duplicate diagnostic attempt protection must still prevent duplicate evidence creation.

## Acceptance criteria
- App typechecks and lint command completes.
- Prisma schema includes the item-bank model and database is updated.
- 30–50 item-bank rows are seeded.
- Diagnostic page renders from active item-bank Diagnostic items.
- Diagnostic submission still creates evidence events, updates mastery, updates misconception probabilities, updates tutor recommendation, and appears in the timeline.
- `/items` clearly displays seeded item metadata and mappings.
- Smoke test includes `/items` and passes.
- Browser QA covers `/items`, `/diagnostic`, `/timeline`, `/tutor`, and `/mastery`.

## Test plan / test cases
- Run schema generation/database sync after model changes.
- Run `bun run lint`.
- Run MVP smoke test against the running preview URL.
- Browser QA:
  - Visit `/items`; confirm item count, multiple item types, skill IDs, misconception IDs, difficulty, transfer level, and active state are visible.
  - Visit `/diagnostic`; confirm the same 10 diagnostic questions render.
  - Submit smoke/API diagnostic flow; confirm `/tutor`, `/mastery`, and `/timeline` still reflect updates.

## Implementation notes
- Preserve `q1`–`q10` item IDs for the current scoring engine.
- Do not add lesson/worksheet concepts to item-bank records.
- Keep seeded items academically meaningful: each should target skill evidence, misconception evidence, retention evidence, transfer evidence, or explanation evidence.
- Use active/inactive and version fields now even if editing/version workflows come later.

## Status / open questions
- Status: done for Sprint B.
- Open question for Sprint C: whether next-best-action selection should pick from item-bank records by recommendation type, retention due date, or misconception probability first.