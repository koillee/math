# Retention Queue v1

## Overview
Retention Queue v1 adds a small, explainable review layer for the existing Year 6 Fractions, Decimals & Percentages MVP. Retention means checking whether a skill can still be recalled and explained after time has passed, not simply whether the student once answered it correctly. The queue uses existing evidence, mastery, misconception risk, confidence calibration, and active item-bank review items to show what should be reviewed now, soon, or later.

## Goals
- Help the parent/student see which Year 6 FDP skills need review before learning fades.
- Classify skills into Due now, Due soon, Stable, and Needs more evidence using simple deterministic rules.
- Select one active Retention or Review item for due skills from the existing structured item bank.
- Let a selected retention review create evidence and refresh mastery, misconceptions, recommendations, parent report, and timeline.
- Keep the feature small, inspectable, and consistent with the existing MasteryOS evidence loop.

## Scope / non-goals
In scope:
- Skill-level retention queue generated from existing data.
- `/retention` page with queue sections, explanations, selected items, and links to practise.
- Retention practice submission through the existing one-item activity form/service boundary.
- Timeline inclusion for `Retention Practice` events.
- Tutor and parent-report retention summaries.
- Smoke and browser QA updates.

Out of scope:
- No curriculum redesign.
- No lessons.
- No worksheets.
- No printable/PDF daily pages.
- No expansion beyond Year 6 mathematics and the current FDP item bank.
- No full spaced-repetition algorithm, calendar planner, notifications, or daily-plan generator.
- No new multi-item review session.

## User flows / UX / design notes
- Parent opens `/retention` to understand what needs short review and why.
- The page explains that retention review is a memory check, not a punishment or grade.
- Due now and Due soon entries show a recommended Review/Retention item if the item bank has one.
- Parent/student clicks “Practise this review item,” which opens `/next?itemId=...` using the existing focused activity form.
- After submission, the app saves `Retention Practice` evidence, refreshes the profile, and sends the user back to Tutor with a success message.
- Timeline shows whether an attempt came from Diagnostic Assessment, Next Best Action, or Retention Practice.
- Parent report uses plain language: what needs review now, why, what is stable, and what to do next.

Design direction:
- Keep the calm ivory/ink dashboard style.
- Use clear labels and reasons before raw IDs.
- Show item metadata as supporting detail, not as a lesson/worksheet.

## Functional requirements
- Add a retention queue service that reads:
  - `StudentMastery`
  - `EvidenceEvent`
  - `StudentRecommendation`
  - `StudentMisconception`
  - `MathItem`
  - active seeded Year 6 FDP skills
- Classify each skill into:
  - `Due now`
  - `Due soon`
  - `Stable`
  - `Needs more evidence`
- Rules should be explainable and deterministic. Signals include:
  - low/fragile mastery
  - no recent evidence
  - older `nextReviewDueAt`
  - recent incorrect evidence
  - weak explanation or representation evidence
  - weak confidence calibration
  - active misconception risk
  - low retention score
  - lack of evidence
- For each queue entry, show:
  - skill name and skill ID
  - current mastery estimate
  - retention status
  - plain-English reason
  - last practiced date if available
  - suggested review timing
  - selected item if available
  - item type
  - difficulty
  - transfer level
  - misconception mapping if relevant
- Item selection rules:
  - only active Year 6 Mathematics items
  - prefer Retention item for the same skill
  - if no Retention item exists, use Review item for the same skill
  - if neither exists, show “No review item currently available”
  - prefer lower prior use count, then lower sequence, then deterministic item ID
- Add `/retention` page.
- Add Retention navigation item.
- Add a retention summary card to `/tutor`.
- Add support for `/next?itemId=<id>` so retention can open a specific item while preserving the default recommendation-based `/next` flow.
- Retention practice must create `EvidenceEvent.eventType = "Retention Practice"`.
- Retention practice must refresh mastery, misconception state, recommendation, parent report, and timeline.

## Data model / schema
Use existing tables. No schema change is required for Sprint D.

Important existing fields:
- `StudentMastery.retentionScore`
- `StudentMastery.nextReviewDueAt`
- `StudentMastery.lastEvidenceAt`
- `StudentMastery.misconceptionRiskScore`
- `EvidenceEvent.eventType`
- `EvidenceEvent.itemId`
- `MathItem.itemType`
- `MathItem.skillNodeId`
- `MathItem.misconceptionIds`
- `ParentReport.retentionStatus`

Retention practice evidence should use:
- `eventType = Retention Practice`
- `assessmentAttemptId = retention-...`
- `itemId = selected MathItem.itemId`
- `evidenceCategory = MathItem.evidenceCategory`
- `skillNodeId = MathItem.skillNodeId`

## API contracts
`GET /retention`:
- Server-rendered page from the retention queue service.

`GET /next?itemId=<id>`:
- Server-rendered next activity page using the requested active Review/Retention item when valid.
- If no valid item is found, fall back to the default recommendation-based next action and show a clear reason.

`POST /api/next` extension:
```json
{
  "attemptId": "retention-client-id",
  "itemId": "ret-fra-001-a",
  "activityType": "retention",
  "submission": {
    "answer": "student answer",
    "explanation": "student explanation",
    "representation": "selected representation",
    "confidence": 4,
    "timeOnTaskSeconds": 45
  }
}
```

Success response remains:
```json
{ "ok": true, "result": { "touchedSkills": [], "touchedMisconceptions": [], "recommendation": {} } }
```

Failure response remains:
```json
{ "error": "Readable error message" }
```

## Edge cases / failure modes
- No diagnostic/evidence yet: queue should show Needs more evidence and guide the user to diagnostic.
- Skill has evidence but no Review/Retention item: show the skill and reason, but clearly say no review item is currently available.
- Invalid `/next?itemId=`: fall back without crashing.
- Duplicate retention submission attempt ID should not create duplicate evidence.
- Correct answer with weak explanation should improve evidence but not overclaim permanent mastery.
- Wrong retention answer should update mastery/recommendation and may increase misconception probability if the item maps to one.
- Existing diagnostic and default `/next` must keep working exactly as before.

## Acceptance criteria
- App builds and typechecks.
- Smoke test passes.
- `/retention` exists and loads.
- `/retention` shows Due now, Due soon, Stable, and Needs more evidence sections.
- Queue uses existing evidence and mastery data.
- Queue selects active Review/Retention `MathItem` rows from the item bank.
- User can practise a retention item through `/next?itemId=...`.
- Retention practice creates a new `EvidenceEvent`.
- Mastery updates after retention practice.
- Recommendation refreshes after retention practice.
- Timeline shows Retention Practice.
- Parent report reflects retention information.
- Existing diagnostic still works.
- Existing default `/next` flow still works.
- Existing `/items` page still works.
- Browser QA passes.
- Checkpoint is saved.

## Test plan / test cases
- Run lint/typecheck command.
- Run MVP smoke test against the running preview URL.
- Smoke flow:
  - reset data
  - load `/retention` empty/needs-evidence state
  - submit diagnostic to create mastery and recommendation
  - confirm `/retention` shows queue sections and a review item when available
  - submit retention practice via API with `activityType = retention`
  - confirm `/evidence` includes Retention Practice
  - confirm `/timeline` includes Retention Practice
  - confirm `/tutor`, `/mastery`, `/next`, `/items`, and `/parent-report` still load
- Browser QA:
  - `/diagnostic`
  - `/tutor`
  - `/next`
  - `/retention`
  - `/timeline`
  - `/mastery`
  - `/items`
  - `/parent-report`
  - `/evidence`
- Check console and network logs during browser QA.

## Implementation notes
- Use simple rule thresholds for Sprint D. Do not implement a complex spaced-repetition optimizer.
- Background research supports spacing and retrieval practice as helpful for long-term retention, but Sprint D should translate that into parent-friendly product behavior rather than scientific terminology.
- Keep item practice as one focused activity. Retention Queue v1 does not create lessons or worksheets.
- Prefer plain-language reasons like “This skill has evidence, but the retention score is low” or “This skill has not been checked recently.”
- Keep services in `src/lib/learning` and reuse existing process/grading code where possible.

## Status / open questions
- Status: done for Sprint D.
- Open questions for later:
  - Should future versions store durable queue snapshots?
  - Should future versions support multi-item review sessions or daily plans?
  - What review interval should be used once there are several weeks of real retention data?
