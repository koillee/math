# Equivalent-fractions reflection pilot

## Purpose

This is a narrow, reversible two-week test of one question: can the app help Haim pause after practice, examine one idea, and solve a changed problem without a parent or tutor beside her?

The provisional concept is **equivalent fractions**. No accessible production learning history was available while this pilot was built, so the choice is based on Haim's known fraction readiness and the existing reviewed question bank. Equivalent fractions also support visual comparison and later work in simplifying and comparing fractions.

The pilot does not use a free-form AI tutor, video, speed competition, hint penalties, or an unlimited retry loop.

## Student flow

1. Daily Practice announces the short fix-it mission at the start.
2. One equivalent-fractions question is included in the six-question set.
3. If the answer needed review, Haim chooses the thought closest to hers. The choice selects context only; it is not treated as a diagnosis.
4. Haim taps to split a fraction bar and sees why `1/2 = 2/4` without changing the amount.
5. She solves one changed problem with no hint.
6. After two unsuccessful tries, the app works through the answer and ends the mission.
7. If the original work was secure, the mission asks how she knew instead of manufacturing an error.
8. Three days after a repair mission, the app checks the same idea with different numbers.

## What is recorded

The optional `reflectionMission` field is stored inside the existing browser-based Daily Practice record. No database migration is required.

- Mission started and completed
- Whether the original Daily Practice hint was opened
- Thinking choice, stored as a reflection response rather than a misconception label
- Changed-problem result, attempts, and whether guided resolution was needed
- Three-day review result

Completion alone never marks the concept as mastered.

## Two-week family test

- Let Haim use the normal Daily Practice flow without a parent stepping in during the mission.
- Keep the usual session close to 15 minutes. Stop for the day if the added mission causes visible frustration or makes the session meaningfully too long.
- A parent checks Parent Report once each weekend, not after every session.
- Look at the separate counts for changed problems solved without a hint, guided finishes, and three-day checks.
- Do not interpret one correct answer as mastery. Look for repeated independent solutions and at least one later check.
- Note one short observation each weekend: Did Haim pause to think? Did she explain the same-amount idea in her own words? Did the mission feel neutral rather than punitive?

At the end of two weeks, keep or expand the pattern only if it is short enough, Haim accepts the flow, and independent changed-problem or delayed-review evidence is becoming more consistent. Revise or stop it if she rushes through the choices, the extra step causes avoidance, or guided finishes remain common without improvement.

## Scope and rollback

The feature is controlled by `REFLECTION_PILOT_ENABLED` in `src/lib/learning/reflection-pilot.ts`. Setting it to `false` removes the guaranteed pilot question from future plans. The UI integration is contained in the Daily Practice reflection stage and the Parent Report pilot card. Existing Daily Practice records remain readable because the new field is optional.

The current storage is browser-local. Results appear in Parent Report only in the same browser profile and can be lost if site data is cleared. Cross-device persistence should be evaluated separately before any broader rollout.
