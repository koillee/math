# Today's Practice Flow v0.5

## Overview
Today's Practice Flow v0.5 makes MasteryOS Math easier to use at home. Instead of asking the parent to understand every dashboard, it gives one clear daily action: open `/today`, do five short Year 6 FDP practice problems, submit them, and see a simple completion summary. This sprint focuses on usability and daily testing, not adding a new learning engine.

## Goals
- Add one obvious daily practice entry point for parent/student use.
- Generate one stable five-item practice set per day for the single seeded student.
- Select problems from the existing structured Year 6 Fractions, Decimals & Percentages item bank.
- Use current recommendation and retention data to explain why items were chosen.
- Submit the full set and create `Daily Practice` evidence events.
- Refresh mastery, misconception state, recommendation, retention queue, timeline, tutor summary, and parent-facing report views.
- Keep the flow English-only for now.

## Scope / non-goals
In scope:
- `/today` page.
- Dashboard button: “Start today's practice”.
- Simple persistence for daily practice sessions and selected items.
- Five on-screen practice problems selected from active `MathItem` rows.
- Whole-set submit flow with answer, explanation, representation, confidence, and time-on-task per item.
- Completion summary.
- Timeline/evidence/tutor/parent-report visibility for daily practice.
- Smoke and browser QA updates.

Out of scope:
- No bilingual/Korean support in this sprint.
- No curriculum redesign.
- No lessons.
- No worksheets.
- No printable/PDF daily pages.
- No gamification, streaks, badges, rewards, accounts, payments, or complex scheduling.
- No full AI tutor chat.
- No full calendar or spaced-repetition optimizer.
- No expansion beyond Year 6 FDP.

## User flows / UX / design notes
Primary flow:
1. Parent/child opens the dashboard.
2. Clicks “Start today's practice”.
3. `/today` shows five selected practice problems and simple reasons.
4. Child answers every problem, explains thinking, picks a representation, and rates confidence.
5. Submit once.
6. `/today` shows “Today's practice is complete”, number correct, skills practised, and next suggested action.
7. Timeline and parent-facing pages show what happened today.

Design rules:
- Main flow should feel like home practice, not a technical dashboard.
- Use plain language: “Today’s practice”, “Why this was chosen”, “What we learned today”.
- Avoid leading with raw IDs, misconception probability, evidence events, or transfer scores.
- Technical details can appear in small metadata/details areas only.

## Functional requirements
- Add `/today` page.
- Add Today navigation item near the top.
- Add a prominent dashboard action linking to `/today`.
- Generate/select five items per day.
- If today's session already exists, show the same item set on refresh.
- Do not create a different set every refresh.
- Use active `MathItem` records only.
- Avoid duplicate items and duplicate skill nodes within a daily set where possible.
- Selection should consider:
  - current active recommendation / next best action
  - retention queue due items
  - misconception repair need when relevant
  - weaker reviewed skills
  - transfer/challenge item if the student appears ready
  - deterministic fallback items if exact matches are unavailable
- Show every item with:
  - number
  - title
  - prompt
  - reason chosen
  - answer input
  - explanation input
  - representation choice
  - confidence rating
- Validate all five answers before saving.
- Submission creates one `EvidenceEvent` per daily item using `eventType = "Daily Practice"`.
- Submission updates mastery, misconception state, recommendation, retention-derived state, parent report data, and timeline.
- Mark daily session completed and persist completion summary.
- Completed state should show:
  - “Today's practice is complete”
  - number correct
  - skills practised
  - simple “what we learned today” text
  - links to stop/view timeline/do next action/view retention queue

## Data model / schema
Add simple persistence models:

`DailyPracticeSession`
- `id`
- `studentId`
- `practiceDate` string in `YYYY-MM-DD` UTC form
- `status` (`not_started`, `completed`)
- `generatedAt`
- `completedAt`
- `summary`
- timestamps

`DailyPracticeItem`
- `id`
- `sessionId`
- `itemId`
- `position`
- `reasonChosen`
- `sourceType`
- `completed`
- timestamps

Keep schema intentionally small. Evidence remains the source of learning updates.

## API contracts
`GET /today`:
- Server-rendered page using today's stable session.

`POST /api/today` request body:
```json
{
  "sessionId": "daily-session-id",
  "attemptId": "daily-practice-2026-08-25",
  "submission": {
    "item-id-1": {
      "answer": "student answer",
      "explanation": "student explanation",
      "representation": "selected representation",
      "confidence": 4,
      "timeOnTaskSeconds": 45
    }
  }
}
```

Success response:
```json
{ "ok": true, "result": { "correctCount": 4, "totalCount": 5, "skillsPractised": [] } }
```

Failure response:
```json
{ "error": "Readable error message" }
```

## Edge cases / failure modes
- No recommendation yet: generate from retention/review/diagnostic fallback and explain that the diagnostic will improve selection.
- Not enough exact retention/recommendation matches: use closest active item-bank fallback and explain simply.
- Duplicate refresh: same session should appear.
- Duplicate submit: should not create duplicate evidence.
- Missing answer: show clear validation error.
- Completed session: show completion state instead of another form.
- Wrong answers are useful evidence and must not be framed as failure.

## Acceptance criteria
- App builds and typechecks.
- `/today` exists.
- Dashboard clearly links to `/today`.
- `/today` generates one stable five-item daily session.
- Refresh keeps the same item set.
- User can answer and submit all five items.
- Submission creates `Daily Practice` evidence events.
- Mastery updates.
- Recommendation refreshes.
- Timeline shows `Daily Practice` grouped as one activity.
- Tutor and Parent Report show latest daily-practice information.
- Existing diagnostic, next action, retention queue, item bank, mastery, timeline, tutor, parent report, and evidence pages still work.
- Smoke test passes.
- Browser QA passes.
- Checkpoint is saved.

## Test plan / test cases
- Run Prisma schema sync/generation after model changes.
- Run `bun run lint`.
- Run `bun run test:mvp -- <preview-url>`.
- Smoke:
  - reset data
  - `/today` loads and shows five items
  - refresh keeps item IDs stable
  - submit daily practice through API
  - `/evidence` shows `Daily Practice`
  - `/timeline` shows `Daily Practice`
  - `/tutor` and `/parent-report` show daily-practice note
  - existing diagnostic/next/retention still work
- Browser QA:
  - dashboard Start today's practice button
  - `/today` form fill and submit
  - completed state
  - timeline/evidence/parent report updates
  - existing key pages load without console errors

## Implementation notes
- Keep Sprint E-lite practical and small.
- Reuse item-bank grading and profile-refresh logic.
- Do not add new curriculum content unless absolutely necessary; prefer existing items.
- Keep reasons short and parent/student friendly.
- English only in this sprint.

## Status / open questions
- Status: done. Implemented and validated with lint/typecheck, MVP smoke test, and browser QA on 2026-08-25.
- Validation notes:
  - `bun run lint` passed.
  - `bun run test:mvp -- https://3000-iqazqti4ealbh12nkupx5.e2b.app` passed.
  - Browser QA covered dashboard entry, `/today` five-problem form, UI submission, completed state, daily-practice evidence, timeline, tutor, parent report, and key existing pages.
- Open questions for later:
  - Should daily practice become bilingual after the flow is tested?
  - Should daily practice keep historical browsing by date?
  - Should item-bank size be expanded after real home testing reveals repetition limits?
