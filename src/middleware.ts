import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  getAppAccessSettings,
  hasValidAppSession,
  isPublicAccessPath,
} from "@/lib/server/production-safety";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function addPrivateHeaders(response: NextResponse) {
  for (const [name, value] of Object.entries(privateHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

function privateTextResponse(body: string, status: number) {
  return addPrivateHeaders(
    new NextResponse(body, {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }),
  );
}

export async function middleware(request: NextRequest) {
  const settings = getAppAccessSettings();
  if (!settings.enabled) return NextResponse.next();

  if (!settings.configured) {
    return privateTextResponse(
      "This private app is not configured for access yet.",
      503,
    );
  }

  if (isPublicAccessPath(request.nextUrl.pathname)) {
    return addPrivateHeaders(NextResponse.next());
  }

  const hasSession = await hasValidAppSession(
    request.cookies.get(APP_SESSION_COOKIE)?.value,
    settings,
  );
  if (!hasSession) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return addPrivateHeaders(
        NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        ),
      );
    }

    const loginUrl = new URL("/login", request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      loginUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
    }
    return addPrivateHeaders(NextResponse.redirect(loginUrl));
  }

  return addPrivateHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest).*)",
  ],
};
