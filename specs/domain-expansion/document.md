# Domain Expansion v1 — Number & Operations plus Ratio, Proportion & Rates

## Overview
Expand MasteryOS Math from a Fractions, Decimals & Percentages-only MVP into a broader Year 6 mathematics learning profile covering three connected domains:

1. Fractions, Decimals & Percentages — existing domain
2. Number & Operations — new domain
3. Ratio, Proportion & Rates — new domain

The goal is to give the system the same kind of foundation for the two new domains that FDP already has: skill graph nodes, misconception framework entries, representative item-bank records, evidence capture, mastery updates, retention queue participation, next-best-action selection, daily practice eligibility, and parent/tutor reporting.

This is not yet a large content-bank sprint. The user will decide later how many additional items to add. This sprint creates a compact, safe scaffold and representative items so the app can operate across the broader scope.

## Goals
- Add Year 6 skill graph coverage for Number & Operations.
- Add Year 6 skill graph coverage for Ratio, Proportion & Rates.
- Add prerequisite/dependency edges connecting the new domains to existing FDP foundations where appropriate.
- Add common misconception definitions for both new domains.
- Add representative item-bank items for each new domain across the existing item purposes:
  - Diagnostic
  - Review
  - Retention
  - Misconception Repair
  - Explanation
  - Transfer
  - Challenge
- Ensure daily practice can select from the new domains.
- Ensure `/items`, `/mastery`, `/retention`, `/next`, `/today`, tutor, timeline, evidence, and parent report continue to work.
- Update user-facing copy from FDP-only language to broader Year 6 maths language where needed.

## Scope / non-goals
In scope:
- Seed data expansion only; no new database tables.
- Representative, curated items for the two new domains.
- Generic diagnostic grading for newly seeded diagnostic items using item-bank accepted answers and misconception mappings.
- UI copy updates so the product no longer claims to cover only FDP.
- Smoke-test updates for the larger diagnostic item set.

Out of scope:
- No full Year 6 curriculum map.
- No exhaustive item bank.
- No random or AI-generated item creation.
- No bilingual support.
- No worksheets, lessons, PDFs, gamification, accounts, or payments.
- No separate domain picker yet; recommendations remain global across the seeded Year 6 maths profile.

## User flows / UX / design notes
- Parent opens dashboard and sees Haim’s Year 6 maths learning state, not only FDP.
- Diagnostic now includes representative checks from FDP, Number & Operations, and Ratio/Proportion/Rates.
- Daily practice still shows five problems, selected from active Year 6 maths items using the current profile.
- Item Bank shows the broader seeded Year 6 maths item bank and each item’s domain/strand.
- Mastery profile and retention queue include the new skill nodes automatically.
- Parent report and tutor copy should use broad “Year 6 maths” language unless a specific domain is being named.

## Functional requirements
- Add new skill nodes for Number & Operations, including at minimum:
  - multi-digit operations
  - factors and multiples
  - prime/composite reasoning
  - order of operations
  - negative numbers in context
  - estimation and inverse operations
- Add new skill nodes for Ratio, Proportion & Rates, including at minimum:
  - ratio notation and simplification
  - sharing in a ratio
  - proportion and scaling
  - unit rates
  - rate comparison
  - ratio/proportion word problems
- Add dependency edges from prerequisite number reasoning into ratio/proportion and from FDP percentage/fraction concepts into rate/proportion reasoning where appropriate.
- Add misconception framework entries for both domains.
- Add representative items for both domains using the current `MathItem` model.
- Keep existing FDP item IDs stable.
- Ensure seeded data upserts safely into existing database.
- Ensure newly added diagnostic items are graded using item-bank data, not only legacy hard-coded `q1`–`q10` cases.
- Ensure reset keeps all seeded skills/items but clears Haim’s attempts/evidence/recommendations/reports/daily sessions.
- Keep Today’s Practice at five questions.

## Data model / schema
No schema changes required.

Existing tables reused:
- `SkillGraph`
- `DependencyGraph`
- `MisconceptionFramework`
- `MathItem`
- `StudentMastery`
- `EvidenceEvent`
- `StudentMisconception`
- `StudentRecommendation`
- `DailyPracticeSession`
- `DailyPracticeItem`
- `ParentReport`

Seed arrays updated:
- `skillNodes`
- `dependencies`
- `misconceptions`
- `itemBankSeeds`

## API contracts
No new API endpoints.

Existing endpoints must continue to work:
- `GET /diagnostic` returns active diagnostic items across the seeded Year 6 maths domains.
- `POST /api/diagnostic` accepts all active diagnostic item responses and updates profile evidence.
- `GET /today` creates or returns a stable five-item practice set from active Year 6 maths items.
- `POST /api/today` submits all five selected items and records `Daily Practice` evidence.
- `POST /api/reset` clears prior attempts while preserving seeded curriculum data.

## Edge cases / failure modes
- The larger diagnostic has more questions; smoke tests must answer every active diagnostic item.
- Newly seeded diagnostic items must not be scored as incorrect only because their item IDs are outside `q1`–`q10`.
- If the new domains have limited items, daily practice may still repeat items; this is expected until a later larger item-bank expansion.
- If no exact recommendation item exists for a target skill, existing fallback logic should still pick the closest active item.
- Existing FDP flows must remain stable.

## Acceptance criteria
- Master spec reflects three-domain Year 6 maths scope.
- New domain expansion spec exists and is linked from master spec.
- New Number & Operations skill nodes are seeded.
- New Ratio, Proportion & Rates skill nodes are seeded.
- New misconceptions are seeded.
- New representative item-bank records are seeded.
- `/items` shows the broader Year 6 maths bank and includes both new domains.
- `/mastery` shows new skills after seeding.
- `/diagnostic` includes new representative diagnostic questions and can submit successfully.
- `/today` still generates a stable five-item daily set.
- Existing smoke test passes.
- Browser QA spot-check passes.
- Checkpoint is saved.

## Test plan / test cases
- Run `bun run lint`.
- Run `bun run test:mvp -- <preview-url>`.
- Smoke must verify:
  - dashboard broad Year 6 maths wording
  - `/items` includes Number & Operations
  - `/items` includes Ratio, Proportion & Rates
  - diagnostic API accepts the expanded answer set
  - Today stable five-item flow remains working
  - evidence/timeline/report/tutor still update
- Browser QA:
  - dashboard loads and does not show stale FDP-only scope as the primary app claim
  - `/items` displays new domains
  - `/diagnostic` displays expanded diagnostic
  - `/today` loads stable five-question flow
  - console/page errors checked

## Implementation notes
- Use compact Year 6 skill-node IDs such as `NUM-001` and `RPR-001`.
- Keep item IDs stable and human-readable, e.g. `q11`, `rev-num-001-a`, `ret-rpr-004-a`.
- Keep generated content curated and deterministic.
- Avoid a large content-writing sprint until the user decides item-bank volume.

## Status / open questions
- Status: done. Implemented and validated on 2026-08-25.
- Validation notes:
  - `bun run lint` passed.
  - `bun run test:mvp -- https://3000-iqazqti4ealbh12nkupx5.e2b.app` passed.
  - Browser QA verified dashboard wording, item-bank domain visibility, expanded 16-question diagnostic display, expanded diagnostic UI submission, Today page wording/stability, and console/page errors.
- Open questions for later:
  - How many items per skill should be added for sustainable daily practice?
  - Should diagnostics be split by domain once total item count grows?
  - Should daily practice balance domains explicitly or continue to target current profile needs globally?
