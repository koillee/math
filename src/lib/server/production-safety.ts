type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

export const APP_SESSION_COOKIE = "__Host-haim_session";
export const APP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type AppAccessSettings = {
  enabled: boolean;
  configured: boolean;
  username: string;
  password: string;
  sessionSecret: string;
};

export function getAppAccessSettings(
  environment: RuntimeEnvironment = process.env,
): AppAccessSettings {
  const username = environment.APP_ACCESS_USERNAME?.trim() || "family";
  const password = environment.APP_ACCESS_PASSWORD ?? "";
  const separateSessionSecret = environment.APP_SESSION_SECRET ?? "";

  return {
    enabled: environment.NODE_ENV === "production",
    configured: password.length > 0,
    username,
    password,
    // The password fallback lets existing deployments migrate without a new
    // setting. An optional separate secret adds independent signing entropy.
    sessionSecret: `haim-math-session-signing-v1\u0000${username}\u0000${password}\u0000${separateSessionSecret}`,
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

export function hasValidAppCredentials(
  username: string,
  password: string,
  settings: Pick<AppAccessSettings, "username" | "password">,
) {
  return (
    constantTimeEqual(username, settings.username) &&
    constantTimeEqual(password, settings.password)
  );
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importSessionKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

type SessionPayload = {
  version: 1;
  username: string;
  issuedAt: number;
  expiresAt: number;
};

export async function createAppSessionToken(
  settings: Pick<AppAccessSettings, "username" | "sessionSecret">,
  now = Date.now(),
) {
  const issuedAt = Math.floor(now / 1000);
  const payload: SessionPayload = {
    version: 1,
    username: settings.username,
    issuedAt,
    expiresAt: issuedAt + APP_SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importSessionKey(settings.sessionSecret),
    new TextEncoder().encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function hasValidAppSession(
  token: string | undefined,
  settings: Pick<AppAccessSettings, "username" | "sessionSecret">,
  now = Date.now(),
) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;

  try {
    const [encodedPayload, encodedSignature] = parts;
    const signatureIsValid = await crypto.subtle.verify(
      "HMAC",
      await importSessionKey(settings.sessionSecret),
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!signatureIsValid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as Partial<SessionPayload>;
    const currentTime = Math.floor(now / 1000);

    return (
      payload.version === 1 &&
      payload.username === settings.username &&
      typeof payload.issuedAt === "number" &&
      typeof payload.expiresAt === "number" &&
      payload.issuedAt <= currentTime + 300 &&
      payload.expiresAt > currentTime &&
      payload.expiresAt - payload.issuedAt === APP_SESSION_MAX_AGE_SECONDS
    );
  } catch {
    return false;
  }
}

export function getAppSessionCookieOptions(
  maxAge = APP_SESSION_MAX_AGE_SECONDS,
) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function isPublicAccessPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout"
  );
}

export function getSafeReturnPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  try {
    const baseUrl = new URL("https://haim-math.invalid");
    const targetUrl = new URL(value, baseUrl);
    if (targetUrl.origin !== baseUrl.origin) return "/";
    if (targetUrl.pathname === "/login" || targetUrl.pathname === "/login/") {
      return "/";
    }
    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return "/";
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
