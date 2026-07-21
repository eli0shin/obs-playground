import { NextResponse, type NextRequest } from "next/server";

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const sessionId = request.cookies.get("app_session_id")?.value ?? randomId("sess");
  const userId = request.cookies.get("app_user_id")?.value ?? randomId("user");

  if (!request.cookies.has("app_session_id")) {
    response.cookies.set("app_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  if (!request.cookies.has("app_user_id")) {
    response.cookies.set("app_user_id", userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
