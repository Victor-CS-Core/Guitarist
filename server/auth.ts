import { getAccountByUsername, type AccountRow } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { clearSessionCookie, issueSession, requireSession, revokeSession } from "./sessions";
import type { Env } from "./index";

export function json(value: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function identity(account: AccountRow) {
  return {
    role: account.role,
    username: account.username,
    displayName: account.display_name,
    ...(account.role === "student" ? { studentId: account.id } : {}),
  };
}

async function ensureTeacher(env: Env): Promise<void> {
  const existing = await env.DB.prepare("SELECT id FROM accounts WHERE role = 'teacher' LIMIT 1").first();
  if (existing || !env.ADMIN_BOOTSTRAP_PASSWORD) return;
  const password = await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD);
  await env.DB.prepare("INSERT INTO accounts (id, username, username_key, role, password_salt, password_hash, password_iterations, display_name, created_at) VALUES (?, 'Ktr0nn', 'ktr0nn', 'teacher', ?, ?, ?, 'Ktr0nn', ?) ON CONFLICT(username_key) DO NOTHING")
    .bind(crypto.randomUUID(), password.salt, password.hash, password.iterations, new Date().toISOString()).run();
}

function ipKey(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

async function reserveAttempt(db: D1Database, key: string, ip: string): Promise<boolean> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60_000).toISOString();
  const blocked = new Date(now.getTime() + 15 * 60_000).toISOString();
  const row = await db.prepare(`
    INSERT INTO login_attempts (username_key, ip_key, attempts, blocked_until, updated_at)
    VALUES (?, ?, 1, NULL, ?)
    ON CONFLICT(username_key, ip_key) DO UPDATE SET
      attempts = CASE
        WHEN login_attempts.blocked_until > ? OR login_attempts.updated_at > ? THEN login_attempts.attempts + 1
        ELSE 1 END,
      blocked_until = CASE
        WHEN login_attempts.blocked_until > ? THEN login_attempts.blocked_until
        WHEN login_attempts.updated_at > ? AND login_attempts.attempts + 1 >= 5 THEN ?
        ELSE NULL END,
      updated_at = CASE WHEN login_attempts.blocked_until > ? THEN login_attempts.updated_at ELSE ? END
    RETURNING attempts
  `).bind(key, ip, now.toISOString(), now.toISOString(), cutoff, now.toISOString(), cutoff, blocked, now.toISOString(), now.toISOString())
    .first<{attempts:number}>();
  return (row?.attempts ?? 0) > 5;
}

async function login(request: Request, env: Env): Promise<Response> {
  let input: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) return json({ error: "Invalid request." }, 400);
    input = JSON.parse(text);
  } catch { return json({ error: "Invalid request." }, 400); }
  if (!input || typeof input !== "object") return json({ error: "Invalid request." }, 400);
  const { username, password } = input as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string" || username.length > 64 || password.length > 256)
    return json({ error: "Invalid username or password." }, 401);
  const key = username.trim().toLocaleLowerCase("en-US");
  const ip = ipKey(request);
  if (await reserveAttempt(env.DB, key, ip) || (ip !== "*" && await reserveAttempt(env.DB, key, "*")))
    return json({ error: "Too many attempts. Try again later." }, 429);
  await ensureTeacher(env);
  const account = await getAccountByUsername(env.DB, key);
  if (!account || account.disabled_at || !(await verifyPassword(password, account))) {
    return json({ error: "Invalid username or password." }, 401);
  }
  await env.DB.prepare("DELETE FROM login_attempts WHERE username_key = ?").bind(key).run();
  return json(identity(account), 200, { "Set-Cookie": await issueSession(env.DB, account.id) });
}

export async function handleAuth(request: Request, env: Env): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/login" && request.method === "POST") return login(request, env);
  if (pathname === "/api/me" && request.method === "GET") {
    const account = await requireSession(request, env);
    return account ? json(identity(account)) : json({ error: "Sign in required." }, 401);
  }
  if (pathname === "/api/logout" && request.method === "POST") {
    await revokeSession(request, env.DB);
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  return null;
}
