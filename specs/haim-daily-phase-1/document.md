# Haim Daily — Phase 1 child practice experience

## Overview
Replace the default dense dashboard with a lightweight, child-first daily maths experience for Haim. The underlying Year 6 learning engine remains intact, but its technical data and owner controls move out of Haim’s everyday path.

## Goals
- Make the Home Screen app open quickly into one clear daily action.
- Require a minimum set of five questions each day.
- Present one question at a time.
- Give immediate, age-appropriate correct/not-yet feedback with an explanation.
- Let Haim choose one additional full set of five questions after finishing the required set.
- Preserve evidence, mastery, recommendation, and retention updates.

## Scope / non-goals
In scope: child home, one-at-a-time practice, immediate answer feedback, five-question completion, existing completed review, optional five-question extra set, child-friendly progress copy, and owner-navigation separation.

Out of scope: accounts, parent PIN, AI chat, re-teaching lessons, unlimited freeform practice, multi-student support, automatic question generation, and deleting the existing engine/admin views.

## User flows / UX / design notes
1. Haim opens the app and sees “Today’s maths”, a simple focus message, and one prominent start button.
2. She sees one question at a time with a clear progress indicator (e.g. 2 of 5).
3. She submits an answer and immediately sees Correct or “Not quite yet”, the expected answer, and a concise explanation.
4. She taps Next question and completes all five.
5. She sees a calm summary and detailed answer review.
6. She can choose “Try another set of 5” or finish for the day.

Design rules:
- No developer metrics, evidence IDs, misconception probabilities, retention tables, or item-bank controls in Haim’s navigation.
- Avoid competitive language and scores as the only feedback. Mistakes are “not quite yet” and always paired with a useful next idea.
- Keep the main page visually calm and sparse for iPad use.

## Functional requirements
- `/` is Haim’s lightweight daily home.
- Reuse the existing stable required daily session when it exists.
- A required session contains five items.
- `/practice` presents only the current item and the set progress.
- Immediate checking must not prematurely expose correct answers before an answer is submitted.
- Result screen shows the submitted answer, expected answer, and feedback.
- Finishing the required set preserves the existing full completion/review experience.
- “Try another set of 5” creates a distinct extra practice session for the same calendar date and persists its evidence separately.
- The extra set uses active items and avoids exact repeats from Haim’s completed practice that day where possible.
- Existing detailed pages remain available as owner/parent views and are removed from the child shell.

## Data model / schema
No destructive migration for Phase 1. Continue using `DailyPracticeSession` and encode optional extra-set session keys as `{YYYY-MM-DD}-extra-{n}` while retaining the existing daily base key `{YYYY-MM-DD}`. Existing unique constraints and evidence records remain valid.

## API contracts
`POST /api/practice/check`
```json
{ "itemId": "ret-fra-001-a", "answer": "3/4", "explanation": "...", "confidence": 3, "representation": "none" }
```
Returns the checked result needed for immediate UI feedback:
```json
{ "ok": true, "correct": true, "expectedAnswer": "...", "feedback": "..." }
```

The existing `POST /api/today` remains the source of truth for saving the five-answer session and refreshing the learning engine.

## Edge cases / failure modes
- If the feedback check fails, preserve Haim’s typed answer and offer retry rather than marking it wrong.
- If the optional-set generation conflicts, load the existing session or show a readable retry message.
- Extra set creation must not replace the required set.
- A refresh during practice restarts the current page only; submitted final evidence remains protected by the existing duplicate-attempt logic.

## Acceptance criteria
- Opening `/` shows a minimal child home instead of the engine dashboard.
- Haim completes five questions one at a time.
- Every answer receives correct/not-yet feedback plus expected answer and explanation before Next.
- Final completion shows review and an extra-set option.
- Extra set has five items and is stored separately.
- Owner/developer navigation is absent from Haim’s normal shell.
- Existing diagnostic, engine pages, and daily review keep functioning.
- Lint, smoke, browser QA, and checkpoint pass.

## Test plan / test cases
- New/unstarted daily state: open home, begin practice, progress from 1 of 5.
- Correct and incorrect check responses.
- Continue through five answers, save, and show completed review.
- Create an extra set, verify it contains five items and different session key.
- Test missing answer and check API error behavior.
- Check owner pages remain reachable directly.
- Run lint, smoke test, and browser QA.

## Implementation notes
- Keep the first iteration low-risk by using the existing five-question final submission API as the persistence source of truth.
- The check endpoint evaluates a single answer for immediate feedback; the final server submission independently re-grades and records evidence.
- A later Phase 1.5 can persist each answer independently and prepare the next day’s plan asynchronously.

## Status / open questions
- Status: implemented and validated on 2026-08-26. Completion handling was hardened after production testing: both required and optional extra sessions now validate by their submitted session ID, and a completed set uses a reliable full-page handoff to the answer-review screen.
- Open question: after pilot feedback, decide whether submitted answers should persist one-by-one before the fifth answer.