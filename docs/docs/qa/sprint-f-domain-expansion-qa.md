# Sprint F Domain Expansion QA Report

Date: 2026-08-25  
Preview URL tested: https://3000-iqazqti4ealbh12nkupx5.e2b.app

## Scope tested

Expanded the seeded Year 6 maths foundation from FDP-only to include:

- Fractions, Decimals & Percentages — existing
- Number & Operations — new
- Ratio, Proportion & Rates — new

## Automated validation

- `bun run lint` — passed.
- `bun run test:mvp -- https://3000-iqazqti4ealbh12nkupx5.e2b.app` — passed.

Smoke validated:

- Dashboard uses broad Year 6 maths wording.
- `/items` includes `Number & Operations` and `Ratio, Proportion & Rates`.
- Expanded diagnostic API accepts and processes all 16 active diagnostic items.
- Duplicate diagnostic attempt protection still works.
- Next action, retention practice, daily practice, evidence, timeline, tutor, parent report, mastery, and item bank flows still work.

## Browser QA coverage

Screenshots captured:

- `qa-screenshots/domain-expansion/01-dashboard-year6-maths.png` — dashboard broad Year 6 maths scope.
- `qa-screenshots/domain-expansion/02-items-new-domains.png` — item bank showing the two new domains.
- `qa-screenshots/domain-expansion/03-diagnostic-expanded.png` — expanded 16-question diagnostic with new-domain items.
- `qa-screenshots/domain-expansion/04-today-year6-maths.png` — Today page using broad Year 6 maths language.
- `qa-screenshots/domain-expansion/05-expanded-diagnostic-submit.png` — expanded diagnostic submitted through the browser UI and redirected to Tutor.

Browser checks confirmed:

- Dashboard shows `Haim’s Year 6 maths learning state`.
- Item bank shows `Number & Operations` and `Ratio, Proportion & Rates`.
- Diagnostic says `answer all 16 questions` and includes new-domain items such as Large-number place value, Equivalent ratio, and Unit rate.
- Expanded diagnostic browser submission created 16 diagnostic evidence events.
- Today page still creates a five-question practice set with broad Year 6 maths copy.
- No page errors were reported by browser tooling.

## Seed counts after expansion

- Active diagnostic items: 16
- Skill graph by domain:
  - Readiness Foundations: 5
  - Fractions, Decimals & Percentages: 22
  - Number & Operations: 8
  - Ratio, Proportion & Rates: 8
- Item bank by domain:
  - Fractions, Decimals & Percentages: 39
  - Number & Operations: 11
  - Ratio, Proportion & Rates: 11

## Reset state

After QA, `/api/reset` was called so Haim’s attempts/evidence/reports/recommendations/daily sessions were cleared for a fresh real run.

## Result

Passed. The app now has a compact multi-domain Year 6 maths scaffold. The new domains have representative coverage, but not yet enough item volume for long-term daily practice without repeats; a later item-bank expansion should decide target item count per skill.
