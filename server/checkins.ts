import type { AccountRow } from "./db";
import { json } from "./auth";
import type { Env } from "./index";

/** Long-term these clips belong in R2 object storage (URL in the row, bytes in
 *  a bucket). D1 is a stopgap: wrangler.jsonc binds only D1, so the base64
 *  bytes live in the checkins table until an R2 binding is added. */
export const MAX_CHECKIN_DURATION_SECONDS = 90;
/** ~2MB of base64 text, which decodes to roughly 1.5MB of audio. */
export const MAX_AUDIO_BASE64_CHARS = 2_000_000;
/** Total JSON body ceiling, a little above the base64 cap plus framing. */
const MAX_REQUEST_CHARS = 2_400_000;
const ALLOWED_MIMES = new Set(["audio/webm", "audio/mp4", "audio/ogg"]);

interface CheckinMetaRow {
  id: string;
  student_id: string;
  student_name: string | null;
  mime: string;
  duration_seconds: number;
  created_at: string;
}

async function readJsonObject(request: Request): Promise<{ input: Record<string, unknown> } | { error: Response }> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { error: json({ error: "Invalid request." }, 400) };
  }
  if (text.length > MAX_REQUEST_CHARS)
    return { error: json({ error: "That recording is too large. Keep it under 90 seconds." }, 413) };
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === "object" && !Array.isArray(value))
      return { input: value as Record<string, unknown> };
  } catch { /* fall through to invalid */ }
  return { error: json({ error: "Invalid request." }, 400) };
}

function validateUpload(input: Record<string, unknown>): { audio: string; mime: string; duration: number } | { error: string; status: number } {
  const mime = typeof input.mime === "string" ? input.mime.trim().toLowerCase() : "";
  const duration = input.durationSeconds;
  const audio = input.audioBase64;
  if (!ALLOWED_MIMES.has(mime))
    return { error: "That audio format isn't supported here.", status: 400 };
  if (!Number.isInteger(duration) || (duration as number) < 1 || (duration as number) > MAX_CHECKIN_DURATION_SECONDS)
    return { error: `Keep your check-in between 1 and ${MAX_CHECKIN_DURATION_SECONDS} seconds.`, status: 400 };
  if (typeof audio !== "string" || audio.length === 0)
    return { error: "No audio was attached.", status: 400 };
  if (audio.length > MAX_AUDIO_BASE64_CHARS)
    return { error: "That recording is too large. Keep it under 90 seconds.", status: 413 };
  if (audio.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(audio))
    return { error: "That audio data looks corrupted. Please record again.", status: 400 };
  return { audio, mime, duration: duration as number };
}

function toSummary(row: CheckinMetaRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    mime: row.mime,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

async function listCheckins(env: Env, actor: AccountRow): Promise<Response> {
  if (actor.role === "student") {
    const rows = await env.DB.prepare(
      "SELECT id, student_id, ? AS student_name, mime, duration_seconds, created_at FROM checkins WHERE student_id = ? ORDER BY created_at DESC LIMIT 50",
    ).bind(actor.display_name, actor.id).all<CheckinMetaRow>();
    return json({ checkins: rows.results.map(toSummary) });
  }
  const rows = await env.DB.prepare(
    "SELECT c.id, c.student_id, a.display_name AS student_name, c.mime, c.duration_seconds, c.created_at FROM checkins c JOIN accounts a ON a.id = c.student_id WHERE a.role = 'student' ORDER BY c.created_at DESC LIMIT 200",
  ).all<CheckinMetaRow>();
  return json({ checkins: rows.results.map(toSummary) });
}

async function createCheckin(request: Request, env: Env, actor: AccountRow): Promise<Response> {
  if (actor.role !== "student") return json({ error: "Only students can record check-ins." }, 403);
  const parsed = await readJsonObject(request);
  if ("error" in parsed) return parsed.error;
  const valid = validateUpload(parsed.input);
  if ("error" in valid) return json({ error: valid.error }, valid.status);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO checkins (id, student_id, mime, audio_base64, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, actor.id, valid.mime, valid.audio, valid.duration, now).run();
  return json({ id, createdAt: now }, 201);
}

async function serveAudio(env: Env, actor: AccountRow, id: string): Promise<Response> {
  const row = await env.DB.prepare("SELECT student_id, mime, audio_base64 FROM checkins WHERE id = ?")
    .bind(id).first<{ student_id: string; mime: string; audio_base64: string }>();
  // Deliberately 404 for another student's clip: don't confirm it exists.
  if (!row) return json({ error: "Check-in not found." }, 404);
  if (actor.role === "student" && row.student_id !== actor.id) return json({ error: "Check-in not found." }, 404);
  if (!ALLOWED_MIMES.has(row.mime)) return json({ error: "Check-in not found." }, 404);
  let bytes: Uint8Array;
  try {
    const binary = atob(row.audio_base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch {
    return json({ error: "That recording can't be played right now." }, 500);
  }
  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=86400",
    },
  });
}

async function deleteCheckin(env: Env, actor: AccountRow, id: string): Promise<Response> {
  const row = await env.DB.prepare("SELECT student_id FROM checkins WHERE id = ?")
    .bind(id).first<{ student_id: string }>();
  if (!row) return json({ error: "Check-in not found." }, 404);
  if (actor.role === "student" && row.student_id !== actor.id) return json({ error: "Check-in not found." }, 404);
  await env.DB.prepare("DELETE FROM checkins WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

export async function handleCheckins(request: Request, env: Env, actor: AccountRow): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/checkins") {
    if (request.method === "GET") return listCheckins(env, actor);
    if (request.method === "POST") return createCheckin(request, env, actor);
    return null;
  }
  const audioMatch = /^\/api\/checkins\/([A-Za-z0-9_-]{1,64})\/audio$/.exec(pathname);
  if (audioMatch && request.method === "GET") return serveAudio(env, actor, audioMatch[1]);
  const deleteMatch = /^\/api\/checkins\/([A-Za-z0-9_-]{1,64})$/.exec(pathname);
  if (deleteMatch && request.method === "DELETE") return deleteCheckin(env, actor, deleteMatch[1]);
  return null;
}
