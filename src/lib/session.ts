import crypto from "crypto";
import { cookies } from "next/headers";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
}

const getSecretKey = (secret: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, "sha256");
};

export async function encryptSession(payload: SessionUser): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured in environment variables");
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getSecretKey(secret, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag}:${encrypted}`;
}

export async function decryptSession(token: string): Promise<SessionUser | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET is not configured in environment variables");
    return null;
  }

  try {
    const parts = token.split(":");
    if (parts.length !== 4) return null;

    const salt = Buffer.from(parts[0], "hex");
    const iv = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    const encrypted = parts[3];

    const key = getSecretKey(secret, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted) as SessionUser;
  } catch (error) {
    console.error("Failed to decrypt session:", error);
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session")?.value;
    if (!cookie) return null;
    return await decryptSession(cookie);
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
}

export async function setSessionCookie(payload: SessionUser): Promise<void> {
  const session = await encryptSession(payload);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
