# Answer Grading Safety and Item-Bank Validation

## Overview
Improve the answer-checking guardrails for Haim Daily and all item-bank-backed practice so near-miss numeric answers are rejected reliably. This responds to the reported case where `0.036 × 1000` was incorrectly marked correct for `360` when the intended answer is `36`.

## Goals
- Replace unsafe substring answer matching with token-aware grading.
- Preserve friendly free-response grading, e.g. `36 because...` should still be accepted for a numeric answer of `36`.
- Reject numeric near misses such as `360`, `3.6`, and `0.36` for the accepted answer `36`.
- Keep current item-bank flows and data model unchanged.
- Add repeatable automated validation for accepted answers, known wrong answers, and regression cases.

## Scope / non-goals
- In scope: deterministic item-bank answer matching, diagnostic matching cleanup where it shares the same risk, validation script, package script, QA notes.
- In scope: adding missing common-wrong metadata for the reported `360` decimal-scaling error.
- Out of scope: redesigning the practice UI, changing mastery formulas, adding LLM grading, or changing the database schema.

## User flows / UX / design notes
- Haim answers one practice question and taps **Check answer**.
- If the answer is exactly correct or a safe equivalent, she sees correct feedback and can continue.
- If the answer is a common near miss, she sees not-yet feedback and the correct expected answer/explanation.
- After the five-question set is saved, the review page should show the same correctness decisions.
- No visual redesign is required for this sprint.

## Functional requirements
1. Numeric accepted answers must match whole numeric tokens, not substrings.
2. Numeric matching must treat safe equivalent formatting as correct, including commas, currency symbols, and trailing decimal zeros where mathematically equal.
3. Percent answers must not silently treat a plain number as a percent unless the answer includes `%`, `percent`, or `percentage`.
4. Fraction and ratio answers must match exact fraction/ratio tokens rather than substrings inside larger tokens.
5. Text answers may still match a complete phrase in a longer explanation, using word-aware boundaries for short answers such as `B`, `add`, or `less`.
6. Common wrong answers must use the same safer matching rules.
7. The reported item `ret-dec-004-a` must reject `360`, `3.6`, and `0.36`, while accepting `36` and `36.0`.
8. The related item `rev-fdp-005-a` with accepted answer `36` must reject `360`.

## Data model / schema
No schema changes. Item-bank seed metadata may be updated to include additional common wrong answers where useful for misconception detection.

## API contracts
- `POST /api/practice/check` remains unchanged:
  - Request: `{ itemId, answer, explanation?, representation?, confidence? }`
  - Success: `{ ok: true, correct, expectedAnswer, feedback }`
  - Error responses unchanged.
- `POST /api/today` remains unchanged, but final persisted evidence uses the safer grading result.

## Edge cases / failure modes
- `360` must not match accepted answer `36`.
- `136` must not match accepted answer `36`.
- `$3`, `3`, and `3.00` should match an accepted answer of `$3` or `3`.
- `20 percent` should match an accepted answer of `20%`; plain `20` should not be treated as a percent-only answer.
- `4/16` must not match `6/16` or `4/6`.
- Single-letter answers like `B` must not match a random `b` inside `because`.
- If an item has both numeric work and the final answer, the correct numeric token can still be found.

## Acceptance criteria
- Automated validation script passes locally.
- `bun run lint` passes.
- MVP smoke test passes against the running preview.
- Browser QA confirms `/api/practice/check` rejects the reported wrong answer and accepts the correct answer.
- `specs/spec.md` status is updated to `done` after validation.

## Test plan / test cases
- Run `bun run test:item-bank`.
- Validate every active seeded item's accepted answers grade as correct.
- Validate every common wrong answer grades as incorrect.
- Validate integer substring near-misses by appending `0` to simple integer accepted answers.
- Regression cases:
  - `ret-dec-004-a`: `36` correct; `36.0` correct; `360`, `3.6`, `0.36`, `136` incorrect.
  - `rev-fdp-005-a`: `36` correct; `360` incorrect.
  - currency/unit-rate: `$3`, `3`, `3.00` correct for unit-rate items; `30` incorrect.
  - percent token: `20%` and `20 percent` correct where `20%` is accepted; plain `20` is not accepted by percent-only matching.

## Implementation notes
- Centralise safer matching in `src/lib/learning/engine.ts`.
- Export the matcher only if needed for direct validation; otherwise validate through `gradeItemBankItem` to test the production path.
- Use the existing Bun/TypeScript setup rather than adding a test framework dependency.
- Keep the script deterministic and fast so it can run before every deployment.

## Status / open questions
- Status: implemented and validated.
- Open questions: none blocking. Future work may add richer semantic or AI-assisted grading, but deterministic safety remains the first gate.