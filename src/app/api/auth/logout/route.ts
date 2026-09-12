import { NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  getAppSessionCookieOptions,
} from "@/lib/server/production-safety";

export async function POST(request: Request) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("loggedOut", "1");
  const response = NextResponse.redirect(loginUrl, 303);
  response.cookies.set(APP_SESSION_COOKIE, "", getAppSessionCookieOptions(0));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
