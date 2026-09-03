import { NextResponse } from "next/server";
import { createExtraPracticeSession } from "@/lib/learning/todays-practice";

export const dynamic = "force-dynamic";

function publicOrigin(request: Request) {
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Fall through to forwarded host handling.
    }
  }

  const requestUrl = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    requestUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, publicOrigin(request)), 303);
}

export async function GET(request: Request) {
  try {
    const session = await createExtraPracticeSession();
    if (!session) throw new Error("Extra session could not be created");
    return redirectTo(request, `/practice?sessionId=${session.id}`);
  } catch (error) {
    console.error("Extra tutor lesson redirect failed", error);
    return redirectTo(request, "/?extraTutorError=1");
  }
}
