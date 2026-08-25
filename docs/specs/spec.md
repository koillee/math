# MasteryOS Math MVP — Master Spec

## Project overview
Build a persistent single-student MVP for an AI-native Year 6 mathematics learning intelligence platform. The MVP proves the loop: diagnose → infer → personalize → explain → report.

## Goals
- Demonstrate persistent student profile and learning intelligence for Year 6 mathematics, starting with Fractions/Decimals/Percentages and expanding to Number & Operations plus Ratio/Proportion/Rates.
- Use approved Year 6 Skill Graph v2, Dependency Graph v2, Mastery Framework v1, and Learning Intelligence Architecture.
- Capture evidence events and update mastery, retention, misconception probabilities, and recommendations.
- Provide student, parent, and developer-facing views.

## Non-goals
- No curriculum redesign.
- No full lesson library.
- No worksheets or large question bank.
- No multi-student accounts, teacher/admin roles, payments, or production deployment.

## Design direction
Premium calm academic intelligence dashboard: ivory background, ink text, muted blue and amber accents, dense but readable cards, no childish gamification, no leaderboards.

## Technical stack decisions
- Next.js App Router + TypeScript.
- Tailwind CSS + shadcn/ui style primitives already available in template.
- PostgreSQL via Prisma for persistent single-student data.
- Deterministic rule-based tutor and mastery engine for MVP; future AI model hook kept behind service boundary.
- Single seeded student: Haim, Year 6, ESF / IB PYP.

## Architecture rules
- Approved graph remains source of truth; task variation belongs in assessment metadata.
- Correctness alone cannot mark mastery.
- Misconceptions are probabilistic and require repeated/verified evidence for active status.
- Parent language must be plain, supportive, and non-alarming.
- Time-on-task is secondary evidence only.
- Evidence events are append-style records used to update current profile tables.

## Feature list
| Feature | Status | Spec |
|---|---|---|
| iPad performance feedback and standalone web app support | done | [specs/ipad-performance-and-pwa/document.md](specs/ipad-performance-and-pwa/document.md) |
| Skill graph seed and dependency graph subset for FDP domain | done | [specs/graph-seed/document.md](specs/graph-seed/document.md) |
| Domain expansion for Number & Operations and Ratio, Proportion & Rates | done | [specs/domain-expansion/document.md](specs/domain-expansion/document.md) |
| Short diagnostic assessment that records evidence and misconception signals | done | [specs/diagnostic-assessment/document.md](specs/diagnostic-assessment/document.md) |
| Rule-based mastery, retention, misconception and recommendation engine | done | [specs/mastery-engine/document.md](specs/mastery-engine/document.md) |
| Student dashboard showing current learning state and next action | done | [specs/dashboard/document.md](specs/dashboard/document.md) |
| Mastery profile showing per-skill scores and reasoning | done | [specs/mastery-profile/document.md](specs/mastery-profile/document.md) |
| AI tutor feedback page using deterministic academic rules with future AI hook | done | [specs/ai-tutor-feedback/document.md](specs/ai-tutor-feedback/document.md) |
| Learning timeline and attempt comparison showing what changed after diagnostics | done | [specs/learning-timeline/document.md](specs/learning-timeline/document.md) |
| Structured Year 6 FDP item bank powering diagnostics and future review/retention/repair/transfer | done | [specs/item-bank/document.md](specs/item-bank/document.md) |
| Next best action flow selecting one targeted item from the item bank | done | [specs/next-best-action/document.md](specs/next-best-action/document.md) |
| Retention queue showing which Year 6 FDP skills need review and selecting Review/Retention items | done | [specs/retention-queue/document.md](specs/retention-queue/document.md) |
| Today’s Practice Flow v0.5 for simple daily five-problem home practice | done | [specs/todays-practice/document.md](specs/todays-practice/document.md) |
| Parent-friendly report summarizing strengths, focus areas and support | done | [specs/parent-report/document.md](specs/parent-report/document.md) |
| Developer evidence log for transparency and debugging | done | [specs/evidence-log/document.md](specs/evidence-log/document.md) |


## Status
MVP v1 implemented and QA-hardened. Sprint F expanded the seeded curriculum foundation beyond FDP into Number & Operations and Ratio, Proportion & Rates. Diagnostic updates now use a JSON API with client-side pending/error state and duplicate-attempt protection before writing evidence. Sprint B added a persistent structured item bank while preserving the current Year 6 FDP diagnostic behaviour. Sprint C added a next-best-action flow that turns recommendations into one targeted activity. Sprint D added a retention queue for explainable review timing, Review/Retention item selection, retention practice evidence, and timeline/report integration. Sprint E-lite added an English-only Today’s Practice flow for simple daily home use.
