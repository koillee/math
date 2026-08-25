# Student dashboard showing current learning state and next action

## Overview
Student dashboard showing current learning state and next action.

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
- Show focus domain, mastery overview, skill cards, retention status, misconception watchlist, and next action.
- Link to diagnostic, mastery profile, tutor feedback, parent report, and evidence log.

## Data model / schema
Use Prisma models aligned to the production schema subset: Student, SkillGraph, DependencyGraph, MisconceptionFramework, EvidenceEvent, StudentMastery, StudentMisconception, StudentRecommendation, ParentReport.

## API contracts
Prefer server actions for mutations and server components for reads. If API routes are used, return JSON with success/error and updated state.

## Edge cases / failure modes
- Missing seed data should trigger auto-seed or clear empty state.
- Weak/ambiguous evidence should not overstate mastery.
- Misconception labels should not be shown alarmingly to students/parents.
- Database errors should surface a readable error state.

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
- Dashboard must distinguish directly assessed skills from the full graph so parents/users do not assume every node was measured by one diagnostic.

## Status / open questions
Status: done for MVP v1, with post-diagnostic update coverage wording added.
Open questions: none blocking.
