import { NextResponse } from "next/server";
import { deleteSessionCookie } from "@/src/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const authUrl = process.env.AUTH_URL || "http://localhost:3000";
  await deleteSessionCookie();
  return NextResponse.redirect(new URL("/login", authUrl));
}
