type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

export type AppAccessSettings = {
  enabled: boolean;
  configured: boolean;
  username: string;
  password: string;
};

export function getAppAccessSettings(
  environment: RuntimeEnvironment = process.env,
): AppAccessSettings {
  const password = environment.APP_ACCESS_PASSWORD ?? "";

  return {
    enabled: environment.NODE_ENV === "production",
    configured: password.length > 0,
    username: environment.APP_ACCESS_USERNAME?.trim() || "family",
    password,
  };
}

function constantTimeEqual(actual: string, expected: string) {
  const length = Math.max(actual.length, expected.length);
  let difference = actual.length ^ expected.length;

  for (let index = 0; index < length; index += 1) {
    difference |=
      (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return difference === 0;
}

export function hasValidBasicAuthorization(
  authorization: string | null,
  settings: Pick<AppAccessSettings, "username" | "password">,
) {
  if (!authorization?.toLowerCase().startsWith("basic ")) return false;

  try {
    const decoded = atob(authorization.slice(6).trim());
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;

    return (
      constantTimeEqual(decoded.slice(0, separator), settings.username) &&
      constantTimeEqual(decoded.slice(separator + 1), settings.password)
    );
  } catch {
    return false;
  }
}

export function isMvpResetAllowed(
  environment: RuntimeEnvironment = process.env,
) {
  if (environment.ALLOW_MVP_RESET !== "true") return false;

  return (
    environment.NODE_ENV !== "production" ||
    environment.VERCEL_ENV === "preview"
  );
}
