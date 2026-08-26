# Daily practice answer review

## Overview
Give Haim a clear, item-by-item review immediately after completing the five-question daily practice. The review shows her submitted answer, whether it was correct, the expected answer, and a short learning explanation for each result.

## Goals
- Turn the daily score into a useful learning moment.
- Make correct and incorrect answers easy to identify without shame.
- Explain common errors in plain, age-appropriate language.
- Preserve the existing evidence and mastery updates.

## Scope / non-goals
In scope: completed `/today` review cards for all submitted items, submitted answers, expected answers, correctness, explanation feedback, and the child’s written explanation.

Out of scope: editing/resubmitting answers, revealing full solutions for every problem, AI-generated tutoring, historical practice browsing, and changes to grading rules.

## User flows / UX / design notes
After submission, the completed page shows the score first, then an expandable-looking “Review your answers” section with five numbered cards. Correct cards use calm green treatment. Incorrect cards use warm amber treatment and explain what to revisit. The wording says “not quite yet” rather than “wrong”.

## Functional requirements
- Show one review card for every daily-practice item in position order.
- Show the original problem title and prompt.
- Show Haim’s submitted answer.
- Show Correct or Review this answer status.
- Show the expected/correct answer.
- Show targeted feedback: correct confirmation or common-error/generic review guidance.
- Show Haim’s explanation when supplied, with a clear fallback when empty.
- Keep the review available after refresh for the completed session.

## Data model / schema
No schema change. Read the existing `EvidenceEvent` joined to its `MathItem`; the event stores the submitted response and grading result, while the item stores the expected answer and common wrong-answer guidance.

## API contracts
No API changes.

## Edge cases / failure modes
- If an evidence event is temporarily unavailable, retain the score summary and show a message that detailed review is still loading.
- If no matching event exists for an item, show “Answer review is not available for this problem yet” rather than guessing.
- Empty explanations are shown as “No explanation was submitted.”

## Acceptance criteria
- After a completed daily practice, all five questions can be reviewed individually.
- Correctness, submitted answer, expected answer, and feedback are visible for each available event.
- Wrong answers receive specific common-error feedback when matched, otherwise helpful generic review wording.
- Review persists on refresh and does not alter learning evidence.
- Existing lint, smoke, and browser flows pass.

## Test plan / test cases
- Submit a mixed-result five-question practice set.
- Verify five review cards, correct/incorrect states, submitted answers, expected answers, and feedback.
- Verify the completed page remains correct after refresh.
- Verify no review is shown before completion.
- Verify empty explanation fallback.
- Run lint and MVP smoke test.

## Implementation notes
Build review data from the existing completed-session evidence query. Match events by item ID and preserve session item ordering. Use stored `commonWrongAnswers` metadata for targeted explanations; do not invent a correct answer or alter grading.

## Status / open questions
- Status: implemented and validated on 2026-08-26.
- Open questions: whether to add a separate historical review screen after the pilot.