# Learning timeline and attempt comparison showing what changed after diagnostics

## Overview
The learning timeline makes MasteryOS Math transparent. It turns raw diagnostic evidence into a chronological story of what the system learned, what changed, and why recommendations changed.

## Goals
- Show diagnostic attempts grouped by `assessmentAttemptId`.
- Compare attempts so improvement, correction, and persistent gaps are visible.
- Give parents a clear explanation of progress without overclaiming mastery.
- Give developer/academic reviewers access to IDs, evidence counts, and score deltas.
- Create the future reasoning log behind daily math plans.

## Scope / non-goals
In scope:
- Timeline page for diagnostic attempts.
- Attempt summary metrics.
- Attempt-to-attempt comparison.
- Misconception signal appeared/reduced/persisted summaries.
- Recommendation after each attempt where available.

Out of scope:
- New curriculum design.
- Lesson generation.
- Worksheet generation.
- Full mastery-history snapshot table. This sprint infers comparison from evidence events; a durable `MasteryHistory` table can come later.

## User flows / UX / design notes
- Parent opens Timeline to understand “what changed after the diagnostic?”
- Student/tutor can see whether a recent correction changed the next recommendation.
- Developer expands details to inspect raw attempt IDs and skill-level deltas.
- Use the existing ivory/ink/amber/blue MasteryOS visual system.

## Functional requirements
- Add `/timeline` page.
- Add Timeline navigation item.
- Group evidence by diagnostic attempt.
- Show per-attempt metrics: evidence count, average accuracy, explanation, transfer, retention, confidence calibration, and representation use.
- Show “what changed” from previous attempt.
- Show improved skills and skill deltas.
- Show misconception signals detected, reduced, new, and persistent.
- Show associated recommendation generated after the attempt where possible.
- Support empty state when no diagnostic attempts exist.

## Data model / schema
Use existing models:
- `EvidenceEvent.assessmentAttemptId`
- `EvidenceEvent.misconceptionSignals`
- `SkillGraph`
- `StudentRecommendation`

No schema change is required for Sprint A.

Future enhancement:
- Add `AssessmentAttempt` and `MasteryHistory` tables for durable before/after snapshots.

## API contracts
Use server-side query helper `getTimelineState()` from learning services. No public mutation API is required.

## Edge cases / failure modes
- Empty evidence: show clear empty state and link to diagnostic.
- Duplicate attempt IDs: already protected by diagnostic API; timeline should still tolerate existing data.
- Missing recommendation: show “No recommendation captured for this attempt.”
- Correct recent evidence should be described as corrective evidence, not permanent retention.
- Historical smoke-test attempts may exist; timeline should remain readable.

## Acceptance criteria
- `/timeline` page loads successfully.
- Timeline shows attempt cards after diagnostics.
- Misconception-heavy then corrective diagnostics show visible change.
- Timeline uses parent-friendly summaries and expandable academic details.
- Navigation and smoke test include Timeline.
- Lint/typecheck and browser QA pass.

## Test plan / test cases
- Reset MVP data and confirm timeline empty state.
- Submit misconception-heavy diagnostic and confirm timeline shows detected misconception signals.
- Submit corrective 100% diagnostic and confirm timeline shows improvement and reduced signals.
- Confirm current recommendation shown on timeline matches Tutor page direction.
- Run `bun run lint`.
- Run `bun run test:mvp -- <preview-url>`.
- Browser QA `/timeline`, check console/errors.

## Implementation notes
- Use inferred comparison from evidence because current MVP does not yet store mastery snapshots by attempt.
- Attempt comparison should favor clarity over exhaustive metrics.
- Keep reusable helper functions in `src/lib/learning/timeline.ts` so future `AssessmentAttempt` table can replace inferred grouping without rewriting the UI.

## Status / open questions
Status: done for Day 1 Sprint A.
Open questions:
- Later: should we add permanent `AssessmentAttempt` and `MasteryHistory` tables before item bank expansion?