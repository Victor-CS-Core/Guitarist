import type { AccountRow } from "./db";
import { createEmptyStudentState, getAccountByUsername } from "./db";
import { hashPassword } from "./password";
import { json } from "./auth";
import type { Env } from "./index";

async function inputObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > 8192) return null;
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 10 && value.length <= 256;
}

export async function handleStudents(request: Request, env: Env, actor: AccountRow): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/students" && request.method === "POST") {
    if (actor.role !== "teacher") return json({ error: "Teacher access required." }, 403);
    const input = await inputObject(request);
    const name = typeof input?.displayName === "string" ? input.displayName.trim() : "";
    const username = typeof input?.username === "string" ? input.username.trim() : "";
    const key = username.toLocaleLowerCase("en-US");
    if (!name || name.length > 80 || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/.test(username) || !validPassword(input?.password))
      return json({ error: "Enter a name, a 3–32 character username, and a password of at least 10 characters." }, 400);
    if (await getAccountByUsername(env.DB, key)) return json({ error: "That username is already in use." }, 409);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const password = await hashPassword(input.password);
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO accounts (id, username, username_key, role, password_salt, password_hash, password_iterations, display_name, created_at) VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)")
          .bind(id, username, key, password.salt, password.hash, password.iterations, name, now),
        env.DB.prepare("INSERT INTO student_records (student_id, state_json, revision, created_at, updated_at) VALUES (?, ?, 1, ?, ?)")
          .bind(id, JSON.stringify(createEmptyStudentState(id, name)), now, now),
      ]);
    } catch {
      return json({ error: "That username is already in use." }, 409);
    }
    return json({ studentId: id }, 201);
  }
  const match = /^\/api\/students\/([^/]+)\/(credentials|status)$/.exec(pathname);
  if (match && request.method === "PATCH") {
    if (actor.role !== "teacher") return json({ error: "Teacher access required." }, 403);
    const account = await env.DB.prepare("SELECT * FROM accounts WHERE id = ? AND role = 'student'").bind(match[1]).first<AccountRow>();
    if (!account) return json({ error: "Student not found." }, 404);
    const input = await inputObject(request);
    if (match[2] === "credentials") {
      if (!validPassword(input?.password)) return json({ error: "Use a password of at least 10 characters." }, 400);
      const password = await hashPassword(input.password);
      await env.DB.prepare("UPDATE accounts SET password_salt = ?, password_hash = ?, password_iterations = ? WHERE id = ?")
        .bind(password.salt, password.hash, password.iterations, account.id).run();
    } else {
      if (typeof input?.disabled !== "boolean") return json({ error: "Choose an account status." }, 400);
      await env.DB.prepare("UPDATE accounts SET disabled_at = ? WHERE id = ?")
        .bind(input.disabled ? new Date().toISOString() : null, account.id).run();
    }
    await env.DB.prepare("DELETE FROM auth_sessions WHERE account_id = ?").bind(account.id).run();
    return json({ ok: true });
  }
  return null;
}
