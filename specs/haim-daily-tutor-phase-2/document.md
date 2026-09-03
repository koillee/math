# Haim Daily Tutor — Phase 2 Teaching-First Practice

## Overview
Turn Haim Daily from a short question set into a short daily tutor. The experience should teach one idea first, show a worked example, then give five multiple-choice practice problems with an open explanation prompt. Mistakes should trigger a clear repair note and a similar retry before moving on.

The first content focus follows the school note: maths puzzles, spotting patterns, multiplication/division, missing numbers, and a place-value review.

## Goals
- Make the child-facing flow easier to understand before practice begins.
- Align daily practice with current school maths: place value, multiplication/division patterns, missing-number puzzles, decimal place value, and powers of 10.
- Reduce grading frustration by using multiple-choice final answers.
- Keep open-ended explanation for mathematical reasoning and parent insight.
- Add mistake repair that teaches the underlying error, not only the correct answer.
- Reduce repeated questions by expanding the school-aligned item bank and prioritising fresh Phase 2 items.
- Keep advanced engine tools available to the owner but hidden from Haim’s normal path.
- Add a simple parent summary that answers: what was practised, what went well, what needs review, and what to do next.

## Scope / non-goals
In scope:
- `/` child home copy updated around “Learn → Try → Review”.
- `/practice` starts with today’s topic, mini lesson, and worked example.
- Practice questions use multiple-choice answer selection plus explanation text.
- Immediate feedback includes correct/not-yet, why the chosen option is right/wrong, and a similar retry after wrong answers.
- `/today` completed view adds a parent-friendly daily summary.
- Add school-aligned item-bank entries for place value, multiplication/division patterns, missing-number puzzles, decimal place value, and powers of 10.
- Daily selection prioritises Phase 2 school-aligned items and avoids recent repeats where possible.
- Owner/developer menus remain reachable, but Haim’s daily flow does not surface evidence/item-bank/mastery internals.

Out of scope:
- No user accounts, payments, uploads, or multi-student roles.
- No LLM-generated questions or explanations in production.
- No database schema migration unless a blocker appears; use deterministic code and existing JSON metadata.
- No full curriculum replacement for Khan Academy or Singapore Math yet.

## User flows / UX / design notes
### Haim’s flow
1. Haim opens the app and sees one clear daily action.
2. She sees today’s topic and a tiny lesson written in child-friendly language.
3. She sees one worked example with step-by-step reasoning.
4. She answers five questions, one at a time.
5. Each question uses multiple-choice buttons for the final answer.
6. She can add a short explanation in her own words.
7. If correct, she sees a concise success note and moves on.
8. If wrong, she sees why that option is a common mistake, the correct idea, and a similar retry question.
9. After five questions, she sees the review page.

### Parent/owner flow
1. Parent opens the completed review or parent summary.
2. The summary says which topic was practised, score, recurring mistake patterns, and recommended home support.
3. Advanced pages remain available under the owner workspace, but they are not part of the child journey.

Design notes:
- Keep the existing calm ivory/ink/amber/blue visual language.
- Avoid dashboard jargon in child-facing pages.
- Use “not quite yet” and “try this idea” rather than “wrong”.
- Keep each lesson short enough for an iPad daily habit.

## Functional requirements
1. A daily practice session still contains at least five problems.
2. A practice session exposes a tutor topic derived from the selected items, with a mini lesson and worked example.
3. The first screen of `/practice` is a lesson/start screen, not the first question.
4. Each practice problem displays answer choices generated from item metadata.
5. Selecting an answer stores the selected answer text as the submitted final answer.
6. The explanation remains optional but visible for reasoning.
7. The Check Answer action is disabled until an answer choice is selected.
8. Wrong choices show mistake-specific feedback when the chosen answer matches a common wrong answer.
9. Wrong choices show one similar retry prompt; retry success is local feedback and does not block the main five-question flow.
10. Final submission still writes evidence through the existing `/api/today` source-of-truth route.
11. Completed review displays item-level results and adds a parent-friendly daily summary.
12. Daily selection prioritises school-aligned Phase 2 items and avoids exact repeats from recent completed daily sessions when possible.
13. Optional extra sets still work.
14. Advanced menus are available through `/owner`, while the child home and parent/review pages focus only on daily tutor actions.

## Data model / schema
No schema change required for Phase 2.

Use existing fields:
- `MathItem.acceptedAnswers` as the correct choice source.
- `MathItem.commonWrongAnswers` as distractors and mistake explanations.
- `MathItem.explanationRubric` for teaching hints and mistake repair metadata where useful.
- `DailyPracticeSession` and `DailyPracticeItem` unchanged.
- `EvidenceEvent` unchanged.

Add deterministic code helpers for:
- tutor topic selection,
- multiple-choice generation,
- mistake-specific feedback,
- similar retry prompts,
- parent daily summary.

## API contracts
`POST /api/practice/check` remains the immediate check endpoint.

Request:
```json
{
  "itemId": "pv2-num-001-a",
  "answer": "70,000",
  "explanation": "The 7 is in the ten-thousands place.",
  "confidence": 3,
  "representation": "multiple choice"
}
```

Response:
```json
{
  "ok": true,
  "correct": true,
  "expectedAnswer": "70,000 because...",
  "feedback": "Correct — ...",
  "repair": null
}
```

For incorrect multiple-choice answers, the response should include repair-friendly text when available.

`POST /api/today` remains unchanged as final persistence.

## Edge cases / failure modes
- If a question has fewer than three common wrong answers, generate safe distractors from deterministic fallbacks.
- Do not display duplicate choices.
- Do not allow “because” or a substring to accidentally count as a selected answer.
- If immediate feedback fails, preserve selected answer and explanation.
- If retry is answered incorrectly, allow moving on; the retry is for learning, not blocking.
- If a daily session was generated before Phase 2 deployment, it should still render with generated choices.
- If all fresh school-aligned items have been used recently, allow repeats only as a fallback.

## Acceptance criteria
- Home clearly presents a daily tutor, not a technical dashboard.
- `/practice` starts with topic, mini lesson, and worked example.
- Five practice problems can be completed with multiple-choice final answers.
- Incorrect answer displays explanation plus similar retry.
- Final review shows item-level correctness and parent summary.
- New school-aligned item-bank content reduces repetition.
- Owner/developer tools remain reachable but are not part of the child or normal parent review flow.
- Lint, item-bank validation, MVP smoke test, browser QA, and checkpoint pass.

## Test plan / test cases
- New daily state: open `/`, start daily tutor, verify lesson screen appears.
- Click “Start practice”, select no answer, verify check button is disabled or prompts answer.
- Select a correct choice and verify correct feedback.
- Select a common wrong choice and verify repair explanation and retry card.
- Complete five questions and verify final review plus parent summary.
- Create optional extra set and verify it still starts with tutor lesson and five choices.
- Run `bun run test:item-bank`.
- Run `bun run lint`.
- Run `bun run test:mvp -- <preview-url>`.
- Browser-test screenshots for home, lesson, multiple-choice question, wrong repair, and completed summary.

## Implementation notes
- Prefer static TypeScript tutor content first; this is safer and easier to maintain than AI-generated teaching.
- Generate choices from existing accepted/common-wrong metadata so no schema migration is needed.
- Prefix new school-aligned item IDs with `pv2-`, `pat2-`, `dec2-`, or `pow2-`.
- Make Phase 2 item selection deterministic and school-aligned for the base daily session.
- Keep the existing final evidence update path unchanged to avoid breaking the engine.

## Status / open questions
- Status: implemented and validated.
- Validation: `bun run lint`, `bun run test:item-bank`, `bun run test:mvp -- https://3001-iqazqti4ealbh12nkupx5.e2b.app`, and browser QA passed. See `docs/qa/haim-daily-tutor-phase-2-qa.md`. Follow-up QA also confirmed the completed home state now exposes a direct “Start a new tutor lesson” path to the new lesson flow. This path uses a plain anchor and server redirect so the entry point does not depend on client-side hydration and preserves the public deployment origin.
- Open questions: none blocking; after Haim uses this version for several days, review whether lessons are too short/long and whether multiple choice improves confidence.