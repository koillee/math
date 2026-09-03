# Answer Grading Safety QA

## Summary
Implemented safer token-aware answer matching and an automated item-bank validation script. The reported bug is fixed: for `0.036 × 1000`, `36` is correct and `360` is now rejected.

## Code validation
- `bun run lint` — passed.
- `bun run test:item-bank` — passed for 61 seeded items.
- `bun run test:mvp -- https://3000-iqazqti4ealbh12nkupx5.e2b.app` — passed.

## Automated item-bank coverage
The new validation script checks:
- Every configured accepted answer grades as correct.
- Every configured common wrong answer grades as incorrect.
- Simple integer substring near-misses, e.g. accepted `36` must reject `360` and `136`.
- Explicit regression cases for:
  - `ret-dec-004-a`: `36` and `36.0` accepted; `360`, `3.6`, `0.36`, and `136` rejected.
  - `rev-fdp-005-a`: `360` rejected for accepted `36`.
  - Diagnostic decimal scaling: `3400` rejected for accepted `340`.
  - Single-letter answers: `B` accepted, but `because` does not accidentally match `B`.
  - Percent/currency equivalents and near misses.

## Browser QA
Preview tested: `https://3000-iqazqti4ealbh12nkupx5.e2b.app`

Screenshots captured:
- `qa-screenshots/grading-safety/01-home-baseline.png`
- `qa-screenshots/grading-safety/02-home-reset-ready.png`
- `qa-screenshots/grading-safety/03-practice-question-1.png`
- `qa-screenshots/grading-safety/04-question-1-feedback.png`
- `qa-screenshots/grading-safety/05-practice-question-2.png`
- `qa-screenshots/grading-safety/06-reported-question-before-wrong.png`
- `qa-screenshots/grading-safety/07-reported-question-360-rejected.png`
- `qa-screenshots/grading-safety/08-question-5-feedback.png`
- `qa-screenshots/grading-safety/09-review-page-with-360-wrong.png`
- `qa-screenshots/grading-safety/10-final-qa.png`

Browser findings:
- Reset local test data and opened Haim Daily from the home page.
- Completed practice questions through the UI.
- On the reported decimal item, entered `360`; the app displayed **Not quite yet** and showed the expected answer `36`.
- Finished the five-question set; the review page showed `360` under Haim’s answer and marked that problem **Review this answer**.
- Direct API check confirmed:
  - `36` → `correct: true`
  - `360` → `correct: false`
  - `3.6` → `correct: false`
  - `0.36` → `correct: false`
- Browser console showed only standard React DevTools/Fast Refresh development messages, with no app errors.

## Incidental fix
Added `public/apple-icon.svg` so the manifest/apple icon URL resolves with HTTP 200 instead of 404 in the preview.