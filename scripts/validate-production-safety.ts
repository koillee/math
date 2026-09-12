import assert from "node:assert/strict";
import {
  APP_SESSION_COOKIE,
  APP_SESSION_MAX_AGE_SECONDS,
  createAppSessionToken,
  getAppAccessSettings,
  getAppSessionCookieOptions,
  getSafeReturnPath,
  hasValidAppCredentials,
  hasValidAppSession,
  isMvpResetAllowed,
  isPublicAccessPath,
} from "../src/lib/server/production-safety";

async function validateProductionSafety() {
  const development = getAppAccessSettings({ NODE_ENV: "development" });
  assert.equal(development.enabled, false);

  const missingPassword = getAppAccessSettings({ NODE_ENV: "production" });
  assert.equal(missingPassword.enabled, true);
  assert.equal(missingPassword.configured, false);

  const protectedProduction = getAppAccessSettings({
    NODE_ENV: "production",
    APP_ACCESS_USERNAME: "parent",
    APP_ACCESS_PASSWORD: "test-password",
  });
  assert.equal(protectedProduction.configured, true);
  assert.equal(
    hasValidAppCredentials("parent", "test-password", protectedProduction),
    true,
  );
  assert.equal(
    hasValidAppCredentials("parent", "wrong-password", protectedProduction),
    false,
  );
  assert.equal(
    hasValidAppCredentials("wrong-user", "test-password", protectedProduction),
    false,
  );

  const now = Date.UTC(2026, 8, 12);
  const token = await createAppSessionToken(protectedProduction, now);
  assert.equal(await hasValidAppSession(token, protectedProduction, now), true);
  assert.equal(token.includes("test-password"), false);
  assert.equal(
    await hasValidAppSession(
      token,
      protectedProduction,
      now + APP_SESSION_MAX_AGE_SECONDS * 1000 - 1,
    ),
    true,
  );
  assert.equal(
    await hasValidAppSession(
      token,
      protectedProduction,
      now + APP_SESSION_MAX_AGE_SECONDS * 1000,
    ),
    false,
  );
  assert.equal(
    await hasValidAppSession(`${token.slice(0, -1)}x`, protectedProduction, now),
    false,
  );
  assert.equal(
    await hasValidAppSession(token, {
      ...protectedProduction,
      sessionSecret: "different-secret",
    }),
    false,
  );

  const separateSecretSettings = getAppAccessSettings({
    NODE_ENV: "production",
    APP_ACCESS_USERNAME: "parent",
    APP_ACCESS_PASSWORD: "test-password",
    APP_SESSION_SECRET: "a-separate-random-session-secret",
  });
  assert.notEqual(
    separateSecretSettings.sessionSecret,
    protectedProduction.sessionSecret,
  );

  assert.equal(APP_SESSION_COOKIE.startsWith("__Host-"), true);
  assert.deepEqual(getAppSessionCookieOptions(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: APP_SESSION_MAX_AGE_SECONDS,
  });

  assert.equal(isPublicAccessPath("/login"), true);
  assert.equal(isPublicAccessPath("/api/auth/login"), true);
  assert.equal(isPublicAccessPath("/api/auth/logout"), true);
  assert.equal(isPublicAccessPath("/api/reset"), false);
  assert.equal(isPublicAccessPath("/"), false);

  assert.equal(getSafeReturnPath("/daily-practice?day=1"), "/daily-practice?day=1");
  assert.equal(getSafeReturnPath("https://example.com"), "/");
  assert.equal(getSafeReturnPath("//example.com"), "/");
  assert.equal(getSafeReturnPath("/\\\\example.com"), "/");
  assert.equal(getSafeReturnPath("/login?next=/owner"), "/");
  assert.equal(getSafeReturnPath(null), "/");

  assert.equal(isMvpResetAllowed({ NODE_ENV: "development" }), false);
  assert.equal(
    isMvpResetAllowed({ NODE_ENV: "development", ALLOW_MVP_RESET: "true" }),
    true,
  );
  assert.equal(
    isMvpResetAllowed({ NODE_ENV: "production", ALLOW_MVP_RESET: "true" }),
    false,
  );
  assert.equal(
    isMvpResetAllowed({
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      ALLOW_MVP_RESET: "true",
    }),
    true,
  );
  assert.equal(
    isMvpResetAllowed({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      ALLOW_MVP_RESET: "true",
    }),
    false,
  );

  console.log("Production session access and reset safety checks passed.");
}

validateProductionSafety().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
