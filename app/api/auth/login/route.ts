import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const authUrl = process.env.AUTH_URL;

  if (!clientId || !authUrl) {
    console.error("Missing Google OAuth credentials or AUTH_URL in environments");
    return NextResponse.redirect(
      new URL("/login?error=missing_credentials", authUrl || "http://localhost:3000")
    );
  }

  const redirectUri = `${authUrl}/api/auth/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  // Save state in cookie for CSRF protection
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    sameSite: "lax",
    path: "/",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;

  return NextResponse.redirect(googleAuthUrl);
}
