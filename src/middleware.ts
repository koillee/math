import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getAppAccessSettings,
  hasValidBasicAuthorization,
} from "@/lib/server/production-safety";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function privateTextResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: {
      ...privateHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function middleware(request: NextRequest) {
  const settings = getAppAccessSettings();
  if (!settings.enabled) return NextResponse.next();

  if (!settings.configured) {
    return privateTextResponse(
      "This private app is not configured for access yet.",
      503,
    );
  }

  if (
    !hasValidBasicAuthorization(
      request.headers.get("authorization"),
      settings,
    )
  ) {
    const response = privateTextResponse("Private family app.", 401);
    response.headers.set(
      "WWW-Authenticate",
      'Basic realm="Haim Math", charset="UTF-8"',
    );
    return response;
  }

  const response = NextResponse.next();
  for (const [name, value] of Object.entries(privateHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest).*)",
  ],
};
