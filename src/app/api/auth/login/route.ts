import { NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  createAppSessionToken,
  getAppAccessSettings,
  getAppSessionCookieOptions,
  getSafeReturnPath,
  hasValidAppCredentials,
} from "@/lib/server/production-safety";

export async function POST(request: Request) {
  const settings = getAppAccessSettings();
  if (!settings.enabled || !settings.configured) {
    return new NextResponse("Private access is not configured.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  const returnPath = getSafeReturnPath(formData.get("next"));

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !hasValidAppCredentials(username, password, settings)
  ) {
    const retryUrl = new URL("/login", request.url);
    retryUrl.searchParams.set("error", "1");
    if (returnPath !== "/") retryUrl.searchParams.set("next", returnPath);
    return NextResponse.redirect(retryUrl, 303);
  }

  const response = NextResponse.redirect(new URL(returnPath, request.url), 303);
  response.cookies.set(
    APP_SESSION_COOKIE,
    await createAppSessionToken(settings),
    getAppSessionCookieOptions(),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
