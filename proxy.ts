import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/src/lib/session";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect admin routes
  if (path.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("session")?.value;
    const session = sessionCookie ? await decryptSession(sessionCookie) : null;

    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Config to specify matching routes
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
