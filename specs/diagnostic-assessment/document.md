# Short diagnostic assessment that records evidence and misconception signals

## Overview
Short diagnostic assessment that records evidence and misconception signals.

## Goals
- Implement this feature as part of the MasteryOS Math MVP.
- Preserve the approved academic architecture.
- Keep behavior deterministic, inspectable, and easy to extend.

## Scope / non-goals
In scope:
- Persistent data where relevant.
- Clear UI or backend service behavior.
- Integration with evidence, mastery, recommendations, or reporting as applicable.

Out of scope:
- Curriculum redesign.
- Full content library.
- Multi-student accounts.
- Payment or public production deployment.

## User flows / UX / design notes
- Use calm, premium dashboard components.
- Student-facing copy should be encouraging.
- Parent-facing copy should be plain-language and non-technical.
- Developer-facing views may expose IDs and raw evidence.

## Functional requirements
- Render 8–12 diagnostic items.
- Capture answer, confidence, explanation, timing, and representation where applicable.
- Score diagnostic intent and create evidence events.
- Trigger mastery, misconception, retention, and recommendation updates.

## Data model / schema
Use Prisma models aligned to the production schema subset: Student, SkillGraph, DependencyGraph, MisconceptionFramework, EvidenceEvent, StudentMastery, StudentMisconception, StudentRecommendation, ParentReport.

## API contracts
Diagnostic submission uses `POST /api/diagnostic` with `{ attemptId, submission }` JSON. The route validates that all diagnostic answers are present, writes evidence events, updates mastery/misconception/recommendation/report tables, revalidates app routes, and returns `{ ok: true, result }` or `{ error }` with an HTTP error status. The legacy server action remains only as a progressive fallback.

## Edge cases / failure modes
- Missing seed data should trigger auto-seed or clear empty state.
- Weak/ambiguous evidence should not overstate mastery.
- Misconception labels should not be shown alarmingly to students/parents.
- Database errors should surface a readable error state.
- Duplicate clicks or browser resubmission should not create duplicate evidence for the same diagnostic attempt.
- A later fully correct diagnostic with good explanations should visibly update mastery and reduce prior misconception probabilities; old evidence should not permanently trap the student in a misconception state.

## Acceptance criteria
- Feature works with the seeded single student.
- Feature writes/reads persistent database data where required.
- Feature follows mastery and learning intelligence rules.
- UI is accessible and responsive.

## Test plan / test cases
- Seed database and load feature page.
- Complete diagnostic flow where relevant.
- Verify evidence, mastery, misconceptions, recommendations, and reports update.
- Check parent/student wording for clarity.

## Implementation notes
- Use approved FDP skill subset and misconception subset.
- Keep services in reusable modules.
- Deterministic logic is preferred for MVP transparency.
- Client form disables controls during submission and redirects to the tutor page only after the API confirms persistence.
- The mastery engine uses recent-weighted evidence and corrective counter-evidence so adaptive updates feel responsive while still preserving retention requirements.

## Status / open questions
Status: done for MVP v1, QA-hardened after diagnostic/update testing.
Open questions: none blocking.
