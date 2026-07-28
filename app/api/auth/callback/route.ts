import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setSessionCookie } from "@/src/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authUrl = process.env.AUTH_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (error) {
    console.error("OAuth Error from Google:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, authUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_code", authUrl));
  }

  // Validate state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", authUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Google Client ID or Client Secret");
    return NextResponse.redirect(new URL("/login?error=missing_credentials", authUrl));
  }

  const redirectUri = `${authUrl}/api/auth/callback`;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error("Token exchange failed:", tokenError);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", authUrl));
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    if (!accessToken) {
      console.error("No access token returned from Google");
      return NextResponse.redirect(new URL("/login?error=no_access_token", authUrl));
    }

    // Fetch user profile from Google UserInfo endpoint
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error("Failed to fetch user info from Google");
      return NextResponse.redirect(new URL("/login?error=google_fetch_failed", authUrl));
    }

    const profile = await userinfoResponse.json();
    const { email, name, picture } = profile;

    if (!email) {
      console.error("User email not returned by Google");
      return NextResponse.redirect(new URL("/login?error=missing_email", authUrl));
    }

    // Save session in cookie
    await setSessionCookie({ email, name, picture });

    // Redirect to /admin page
    return NextResponse.redirect(new URL("/admin", authUrl));
  } catch (err) {
    console.error("Authentication error:", err);
    return NextResponse.redirect(new URL("/login?error=auth_internal_error", authUrl));
  }
}
