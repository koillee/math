const baseUrl = (process.argv[2] ?? process.env.MVP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const pages = ["/", "/today", "/diagnostic", "/next", "/retention", "/items", "/mastery", "/timeline", "/tutor", "/parent-report", "/evidence"];
const misconceptionAnswers = {
  q1: ["1/8", "I think 1/8 is bigger because the denominator 8 is bigger than 4.", "mental comparison", 4],
  q2: ["2/7", "I added the tops and bottoms so 1+1 over 3+4.", "common denominator", 5],
  q3: ["4/6", "It is equal because both numerator and denominator are scaled by 2.", "scaling", 4],
  q4: ["0.56", "0.56 is bigger because 56 is bigger than 7.", "place value", 4],
  q5: ["20", "25 percent is one quarter of the whole, so one quarter of 80 is 20.", "fraction equivalent", 3],
  q6: ["Class B", "Class B is 40 percent, while Class A is 30 percent of its whole.", "percent conversion", 3],
  q7: ["5", "10 percent of 50 is 5 because one tenth of 50 is 5.", "10% strategy", 3],
  q8: ["0.75 and 75%", "Three quarters means 75 out of 100, so it is 0.75 and 75 percent.", "hundred grid", 3],
  q9: ["18", "One half of 36 means divide into two equal groups, so 18.", "bar model", 3],
  q10: ["340", "Multiplying by 100 shifts the place value two places, so 3.4 becomes 340.", "place value chart", 3],
  q11: ["600", "I looked at the 6 and thought it meant six hundreds.", "place value chart", 4],
  q12: ["30", "I went left to right: 6 plus 4 is 10, then times 3 is 30.", "operation steps", 4],
  q13: ["18, 36, 54", "These are factors because they are in the 18 times table.", "factor lists", 4],
  q14: ["4:5", "I added 2 to both parts of 2:3.", "ratio table", 4],
  q15: ["20 and 30", "I split by 2 and 3 separately.", "bar model", 4],
  q16: ["18", "The total cost is 18, so that is the rate.", "unit rate table", 4],
};

const correctAnswers = {
  q1: ["1/4", "One quarter is larger because fourths are bigger equal parts than eighths when the whole is the same.", "fraction strips", 5],
  q2: ["7/12", "Use a common denominator of twelfths: 1/3 is 4/12 and 1/4 is 3/12, so the same-sized parts add to 7/12.", "common denominator", 5],
  q3: ["4/6", "4/6 is equal to 2/3 because both numerator and denominator are scaled by 2, so the value stays the same.", "scaling", 5],
  q4: ["0.7", "0.7 is seven tenths, which is 70 hundredths, and 70 hundredths is greater than 56 hundredths.", "place value", 5],
  q5: ["20", "25 percent is one quarter of the whole, and one quarter of 80 is 20.", "fraction equivalent", 5],
  q6: ["Class B", "Class A is 18 out of 60, which is 30 percent. Class B is 12 out of 30, which is 40 percent, so Class B is higher.", "percent conversion", 5],
  q7: ["5", "The discount is 10 percent of 50. Ten percent means one tenth, and one tenth of 50 is 5.", "10% strategy", 5],
  q8: ["0.75 and 75%", "Three quarters means 75 hundredths, so the decimal is 0.75 and the percentage is 75 percent.", "hundred grid", 5],
  q9: ["18", "One half of 36 means divide 36 into two equal groups, so each group is 18.", "bar model", 5],
  q10: ["340", "Multiplying by 100 scales the number by two place-value positions, so 3.4 becomes 340.", "place value chart", 5],
  q11: ["6,000", "The 6 is in the thousands place, so it is worth six thousand.", "place value chart", 5],
  q12: ["18", "Multiplication comes before addition, so 4 times 3 is 12 and 6 plus 12 is 18.", "operation steps", 5],
  q13: ["1, 2, 3, 6, 9, 18", "I used factor pairs: 1×18, 2×9, and 3×6, so the list is complete.", "factor pairs", 5],
  q14: ["4:6", "Both parts of 2:3 are multiplied by 2, so 4:6 is equivalent.", "ratio table", 5],
  q15: ["16 and 24", "There are five total parts, each part is 8, so the shares are 16 and 24.", "bar model", 5],
  q16: ["$3", "The unit rate is the cost for one notebook, so 18 divided by 6 is 3 dollars per notebook.", "unit rate table", 5],
};

function submissionFromAnswers(source) {
  return Object.fromEntries(
    Object.entries(source).map(([id, [answer, explanation, representation, confidence]]) => [
      id,
      { answer, explanation, representation, confidence, timeOnTaskSeconds: 45 },
    ])
  );
}

async function loadTodayItemIds() {
  const response = await fetch(`${baseUrl}/today`, { redirect: "follow" });
  if (!response.ok) throw new Error(`/today returned HTTP ${response.status}`);
  const html = await response.text();
  return [...html.matchAll(/name="answer-([^"]+)"/g)].map((match) => match[1]);
}

async function submitTodayPractice(itemIds) {
  const todayResponse = await fetch(`${baseUrl}/today`, { redirect: "follow" });
  const html = await todayResponse.text();
  const sessionId = html.match(/data-session-id="([^"]+)"/)?.[1];
  const practiceDate = html.match(/data-practice-date="([^"]+)"/)?.[1] ?? new Date().toISOString().slice(0, 10);
  if (!sessionId) throw new Error("Could not find today's practice session id in page payload");
  const submission = Object.fromEntries(
    itemIds.map((itemId) => [itemId, { answer: "0", explanation: "I tried this today so the app can learn what to review next.", representation: "none", confidence: 2, timeOnTaskSeconds: 45 }])
  );
  const response = await fetch(`${baseUrl}/api/today`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, attemptId: `daily-practice-${practiceDate}-${sessionId}`, submission }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(`today practice API failed: ${JSON.stringify(payload)}`);
  if (payload.result?.totalCount !== 5) throw new Error(`today practice did not process 5 items: ${JSON.stringify(payload)}`);
  return payload;
}

async function submitDiagnostic(attemptId, source) {
  const body = JSON.stringify({ attemptId, submission: submissionFromAnswers(source) });
  const response = await fetch(`${baseUrl}/api/diagnostic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(`diagnostic API failed: ${JSON.stringify(payload)}`);
  if (!payload.result?.touchedSkills?.length) throw new Error("diagnostic API did not update touched skills");
  return { body, payload };
}

async function submitLearningActivity(itemId, source, activityType = "next") {
  const body = JSON.stringify({
    attemptId: `smoke-${activityType}-${Date.now()}`,
    itemId,
    activityType,
    submission: { answer: source[0], explanation: source[1], representation: source[2], confidence: source[3], timeOnTaskSeconds: 45 },
  });
  const response = await fetch(`${baseUrl}/api/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(`${activityType} activity API failed: ${JSON.stringify(payload)}`);
  if (!payload.result?.touchedSkills?.length) throw new Error(`${activityType} activity API did not update touched skills`);
  return payload;
}

async function submitNextAction(itemId, source) {
  return submitLearningActivity(itemId, source, "next");
}

async function submitRetentionPractice(itemId, source) {
  return submitLearningActivity(itemId, source, "retention");
}

async function assertPage(path, expectedText) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const html = await response.text();
  if (expectedText && !html.includes(expectedText)) throw new Error(`${path} did not include expected text: ${expectedText}`);
  console.log(`✓ ${path} ${response.status}`);
}

const resetResponse = await fetch(`${baseUrl}/api/reset`, { method: "POST" });
if (!resetResponse.ok) throw new Error(`/api/reset returned HTTP ${resetResponse.status}`);
console.log("✓ /api/reset cleared prior MVP evidence for deterministic smoke test");

for (const path of pages) await assertPage(path);
await assertPage("/", "Haim’s Year 6 maths learning state");
await assertPage("/items", "Total seeded items");
await assertPage("/items", "Misconception Repair");
await assertPage("/items", "Number &amp; Operations");
await assertPage("/items", "Ratio, Proportion &amp; Rates");
await assertPage("/today", "Five problems for today");
const todayIdsA = await loadTodayItemIds();
const todayIdsB = await loadTodayItemIds();
if (todayIdsA.length !== 5) throw new Error(`/today should generate 5 practice items, found ${todayIdsA.length}`);
if (todayIdsA.join(",") !== todayIdsB.join(",")) throw new Error("/today did not keep a stable same-day item set across refreshes");
console.log(`✓ /today generated a stable 5-item practice set: ${todayIdsA.join(", ")}`);
await assertPage("/retention", "Needs more evidence");

const attemptId = `smoke-misconception-${Date.now()}`;
const { body: diagnosticBody, payload } = await submitDiagnostic(attemptId, misconceptionAnswers);
console.log(`✓ /api/diagnostic created misconception evidence for ${payload.result.touchedSkills.length} skills`);

const duplicateResponse = await fetch(`${baseUrl}/api/diagnostic`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: diagnosticBody,
});
const duplicatePayload = await duplicateResponse.json();
if (!duplicateResponse.ok || !duplicatePayload.result?.duplicateAttempt) throw new Error(`duplicate attempt was not protected: ${JSON.stringify(duplicatePayload)}`);
console.log("✓ /api/diagnostic ignored duplicate attempt without creating another evidence set");

await assertPage("/tutor?submitted=1", "Diagnostic saved");
await assertPage("/tutor", "Misconception Repair");
await assertPage("/next", "Misconception Repair");
await assertPage("/next", "Repair longer decimal is larger");
await assertPage("/retention", "Due now");
await assertPage("/retention", "Practise this review item");
await assertPage("/next?itemId=ret-fra-001-a", "Retention Practice");
await assertPage("/next?itemId=ret-fra-001-a", "Delayed equivalent fraction check");
const nextPayload = await submitNextAction("rep-dec-001-a", ["0.4", "0.4 is 0.400, which is 400 thousandths, and 400 thousandths is greater than 309 thousandths.", "place value chart", 5]);
console.log(`✓ /api/next created next-action evidence for ${nextPayload.result.touchedSkills.length} skill`);
const retentionPayload = await submitRetentionPractice("ret-fra-001-a", ["6/16 and 9/24", "Both are equivalent to 3/8 because the numerator and denominator are scaled by the same factor.", "scaling", 5]);
console.log(`✓ /api/next created retention-practice evidence for ${retentionPayload.result.touchedSkills.length} skill`);
await assertPage("/evidence", "Next Best Action");
await assertPage("/evidence", "Retention Practice");
await assertPage("/timeline", "Next Best Action");
await assertPage("/timeline", "Retention Practice");
await assertPage("/evidence", "MISC-FRA-002");
await assertPage("/parent-report", "Recommended home support");
await assertPage("/parent-report", "Retention / review note");
await assertPage("/tutor", "Retention queue summary");
await assertPage("/timeline", "Misconception signals");

const corrective = await submitDiagnostic(`smoke-corrective-${Date.now()}`, correctAnswers);
if (corrective.payload.result.recommendation?.recommendedAction === "Misconception Repair") throw new Error("corrective diagnostic should move the recommendation away from misconception repair");
console.log(`✓ corrective diagnostic moved recommendation to ${corrective.payload.result.recommendation?.recommendedAction}`);

await assertPage("/tutor", corrective.payload.result.recommendation?.recommendedAction ?? "Review");
await assertPage("/mastery", "Latest evidence was 100% correct");
await assertPage("/timeline", "Corrective evidence");

const todayPayload = await submitTodayPractice(todayIdsA);
console.log(`✓ /api/today created daily-practice evidence for ${todayPayload.result.totalCount} items`);
await assertPage("/today?completed=1", "Today’s practice is complete");
await assertPage("/evidence", "Daily Practice");
await assertPage("/timeline", "Daily Practice");
await assertPage("/tutor", "Today’s practice result");
await assertPage("/parent-report", "Today’s practice");

console.log("MVP smoke test passed.");