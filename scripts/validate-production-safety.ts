import assert from "node:assert/strict";
import {
  getAppAccessSettings,
  hasValidBasicAuthorization,
  isMvpResetAllowed,
} from "../src/lib/server/production-safety";

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
  hasValidBasicAuthorization(
    `Basic ${btoa("parent:test-password")}`,
    protectedProduction,
  ),
  true,
);
assert.equal(
  hasValidBasicAuthorization(
    `Basic ${btoa("parent:wrong-password")}`,
    protectedProduction,
  ),
  false,
);
assert.equal(hasValidBasicAuthorization("not-basic", protectedProduction), false);

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

console.log("Production access and reset safety checks passed.");
