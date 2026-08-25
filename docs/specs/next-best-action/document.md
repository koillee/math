# Next Best Action Flow v1

## Overview
Next Best Action Flow v1 turns the current MasteryOS recommendation into one clear activity selected from the structured Year 6 FDP item bank. The goal is to make the platform feel actionable: after diagnosis and analysis, the parent/student can see exactly what to do next and submit one targeted response that updates the learning profile.

## Goals
- Convert an active `StudentRecommendation` into a selected `MathItem`.
- Add a simple `/next` page that shows the recommendation, selected item, and why it was chosen.
- Allow one next-action response to create evidence and update mastery, misconceptions, recommendations, reports, and timeline.
- Keep the existing diagnostic flow unchanged.
- Preserve the math-intelligence foundation without creating lessons, worksheets, printable pages, or other subjects.

## Scope / non-goals
In scope:
- Deterministic item selection from active item-bank rows.
- One-item activity form for answer, explanation, representation, confidence, and time-on-task.
- JSON submit API for the next activity.
- Evidence event creation with `eventType = Next Best Action`.
- Tutor page link/button into `/next`.
- Timeline inclusion for next-action activity evidence.

Out of scope:
- No adaptive multi-item session.
- No lesson generation.
- No worksheet or printable/PDF output.
- No curriculum redesign.
- No expansion beyond Year 6 FDP.
- No student account/multi-user system.

## User flows / UX / design notes
Primary parent/tutor flow:
1. Run or review a diagnostic.
2. Open `/tutor` and see the current recommendation.
3. Click “Do recommended next activity”.
4. `/next` shows one selected item with clear reasoning.
5. Student answers, explains, chooses representation, and rates confidence.
6. System saves evidence, updates the profile, refreshes recommendation, and redirects to Tutor.
7. Timeline shows the new activity as part of the learning story.

UX rules:
- Use plain language: “why this was chosen” before raw IDs.
- Expose IDs and metadata, but secondary to the parent-friendly explanation.
- Avoid implying that one activity proves permanent mastery.
- Keep the form short and focused.

## Functional requirements
- Add a next-best-action service that reads the latest active `StudentRecommendation`.
- Select one active `MathItem` using recommendation mapping:
  - `Misconception Repair` → `Misconception Repair` item, preferably matching `targetMisconceptionId`.
  - `Review` → `Review` or `Retention` item, preferably matching `targetSkillNodeId`.
  - `Representation Practice` → `Explanation` item, preferably matching `targetSkillNodeId`.
  - `Transfer Challenge` → `Transfer` or `Challenge` item, preferably matching `targetSkillNodeId`.
  - `New Skill` → `Review` or `Diagnostic` item.
- Prefer targeted matches; fall back to the same item type family if no exact skill/misconception match exists.
- Prefer active items with lower prior use count, then deterministic sequence ordering.
- Add `/next` page.
- Show recommendation, selected item, skill, reason, difficulty, transfer level, misconception mapping, answer input, explanation input, representation choice, and confidence rating.
- Add submit flow via `POST /api/next`.
- Submission creates one `EvidenceEvent` with `itemId`, `assessmentAttemptId`, and item metadata.
- Submission refreshes mastery, misconceptions, active recommendation, parent report, and timeline.
- Add “Do recommended next activity” button to `/tutor`.

## Data model / schema
Use existing tables:
- `StudentRecommendation`
- `MathItem`
- `EvidenceEvent`
- `StudentMastery`
- `StudentMisconception`
- `ParentReport`

No schema change is required for Sprint C.

Evidence events for next action should use:
- `eventType = Next Best Action`
- `itemId = selected MathItem.itemId`
- `assessmentAttemptId = next-action-...`
- `evidenceCategory = MathItem.evidenceCategory`
- `skillNodeId = MathItem.skillNodeId`

## API contracts
`GET /next`:
- Server-rendered page using next-best-action service state.

`POST /api/next` request body:
```json
{
  "attemptId": "optional-client-generated-id",
  "itemId": "selected-item-id",
  "submission": {
    "answer": "student answer",
    "explanation": "student explanation",
    "representation": "selected representation",
    "confidence": 3,
    "timeOnTaskSeconds": 45
  }
}
```

Success response:
```json
{ "ok": true, "result": { "touchedSkills": [], "touchedMisconceptions": [], "recommendation": {} } }
```

Failure response:
```json
{ "error": "Readable error message" }
```

## Edge cases / failure modes
- No active recommendation: `/next` should tell the user to run the diagnostic first, while still avoiding a crash.
- No exact targeted item: select a sensible fallback and show fallback reasoning.
- Missing answer: API should return a clear validation error.
- Duplicate submission: duplicate `assessmentAttemptId` should not create duplicate evidence.
- Correct answer with weak explanation should improve accuracy but not overclaim mastery.
- Wrong next-action answer should update evidence and may create misconception signals when item metadata supports it.

## Acceptance criteria
- App typechecks and lint command completes.
- `/next` loads.
- `/next` shows one clear selected item after a recommendation exists.
- User can submit the next activity.
- One evidence event is created with `eventType = Next Best Action` and `itemId`.
- Mastery updates for the selected skill.
- Recommendation refreshes.
- Timeline shows the next-action activity.
- Existing diagnostic still works.
- Smoke test and browser QA pass.

## Test plan / test cases
- Run `bun run lint`.
- Run MVP smoke test against the preview URL.
- Smoke flow:
  - Reset evidence.
  - Load `/next` empty/no-recommendation state.
  - Submit diagnostic to create recommendation.
  - Load `/next` and confirm selected item is visible.
  - Submit next activity via API.
  - Confirm `/tutor`, `/mastery`, `/timeline`, and `/items` still load.
- Browser QA:
  - `/diagnostic`
  - `/tutor`
  - `/next`
  - `/timeline`
  - `/mastery`
  - `/items`
  - Check console/errors.

## Implementation notes
- Keep deterministic grading for Sprint C.
- Generic item grading can use item-bank metadata: accepted answers, common wrong answers, misconception IDs, item type, transfer level, and explanation text.
- Do not overfit next-action scoring to worksheets or lessons; this is still a one-item intelligence loop.
- Preserve the current `q1`–`q10` diagnostic behaviour.

## Status / open questions
- Status: done for Sprint C.
- Open question for Sprint D: how soon should next-action evidence enter a retention queue, and should the queue be item-based or skill-based?