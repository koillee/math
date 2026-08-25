# Day 1 Sprint A Prompt — Learning Timeline + Attempt Comparison

Act as Chief Academic Officer, learning scientist, product manager, and senior full-stack engineer for MasteryOS Math.

Build Sprint A: **Learning Timeline + Attempt Comparison** for the existing Year 6 mathematics mastery intelligence MVP.

Do not redesign the curriculum. Do not create lessons or worksheets. Focus only on making diagnostic learning progress visible, auditable, and parent-readable.

## Objective

Create a `/timeline` experience that answers:

1. What did the system learn from each diagnostic attempt?
2. What changed compared with the previous attempt?
3. Which skills improved, declined, or still need evidence?
4. Which misconception signals appeared, persisted, or reduced?
5. Why did the next recommendation change?

## Product requirements

- Group `EvidenceEvent` rows by `assessmentAttemptId`.
- Show attempt date/time, evidence count, average accuracy, explanation, transfer, retention, confidence calibration, and representation use.
- Compare each attempt with the previous diagnostic attempt.
- Identify improved skills, persistent misconception signals, reduced misconception signals, and new misconception signals.
- Attach the nearest recommendation generated after each attempt where possible.
- Provide two layers of language:
  - parent-readable summary
  - developer/academic details with IDs and raw metrics
- Preserve the existing calm, premium academic dashboard style.

## Academic rules

- Do not claim permanent mastery from one attempt.
- If a misconception signal disappears after correct, explained work, describe it as “corrective evidence” or “reduced signal,” not proof of permanent mastery.
- Separate current evidence from delayed retention.
- Emphasize that the timeline explains the learning model’s reasoning and will later power daily math plans.

## Acceptance criteria

- `/timeline` loads with empty state after reset.
- After a misconception-heavy diagnostic and corrective diagnostic, the timeline shows both attempts.
- The corrective attempt visibly shows improvement and reduced misconception signals.
- Navigation includes Timeline.
- Smoke test covers `/timeline`.
- Lint/typecheck passes.
- Browser QA captures the timeline page without runtime errors.
