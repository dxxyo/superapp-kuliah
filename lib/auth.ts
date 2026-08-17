import crypto from "crypto";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET belum diset di environment variables. Tambahkan string acak apa saja sebagai ADMIN_SECRET di Vercel."
    );
  }
  return secret;
}

export function createSessionToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  let expected: string;
  try {
    expected = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  } catch {
    return false;
  }
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const inputBuf = Buffer.from(input);
  const expBuf = Buffer.from(expected);
  if (inputBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(inputBuf, expBuf);
}

export { COOKIE_NAME };
