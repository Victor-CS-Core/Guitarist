import type { AccountRow } from "./db";
import type { Env } from "./index";

const COOKIE = "__Host-guitarist_session";
const LIFETIME_SECONDS = 60 * 60 * 24 * 7;

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))));
}

function sessionToken(request: Request): string | null {
  const value = request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}

export async function issueSession(db: D1Database, accountId: string): Promise<string> {
  const token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const expires = new Date(Date.now() + LIFETIME_SECONDS * 1000).toISOString();
  await db.prepare("INSERT INTO auth_sessions (token_hash, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await hashToken(token), accountId, expires, new Date().toISOString()).run();
  return `${COOKIE}=${token}; Max-Age=${LIFETIME_SECONDS}; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

export async function requireSession(request: Request, env: Env): Promise<AccountRow | null> {
  const token = sessionToken(request);
  if (!token) return null;
  return env.DB.prepare("SELECT accounts.* FROM auth_sessions JOIN accounts ON accounts.id = auth_sessions.account_id WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ? AND accounts.disabled_at IS NULL")
    .bind(await hashToken(token), new Date().toISOString()).first<AccountRow>();
}

export async function revokeSession(request: Request, db: D1Database): Promise<void> {
  const token = sessionToken(request);
  if (token) await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await hashToken(token)).run();
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/`;
}
