import type { AccountRow } from "./db";
import { getStudentRecord, saveStudentRecord } from "./db";
import { applyCommand } from "../src/domain/commands";
import type { Actor, Command, DemoState } from "../src/domain/types";
import { json } from "./auth";
import type { Env } from "./index";

function emptyState(): DemoState {
  return { version: 1, students: [], assignments: [], sessions: [], notes: [], events: [] };
}

async function stateFor(actor: AccountRow, env: Env) {
  const revisions: Record<string, number> = {};
  if (actor.role === "student") {
    const record = await getStudentRecord(env.DB, actor.id);
    if (!record) return { state: emptyState(), revisions, accounts: [] };
    revisions[actor.id] = record.revision;
    return { state: { ...record.state, notes: [] }, revisions, accounts: [{ studentId: actor.id, username: actor.username, disabled: false }] };
  }
  const state = emptyState();
  const accounts: {studentId:string;username:string;disabled:boolean}[] = [];
  const rows = await env.DB.prepare("SELECT accounts.id, accounts.username, accounts.disabled_at, student_records.state_json, student_records.revision FROM accounts JOIN student_records ON student_records.student_id = accounts.id WHERE accounts.role = 'student' ORDER BY accounts.created_at")
    .all<{id:string;username:string;disabled_at:string|null;state_json:string;revision:number}>();
  for (const row of rows.results) {
    const record = JSON.parse(row.state_json) as DemoState;
    state.students.push(...record.students);
    state.assignments.push(...record.assignments);
    state.sessions.push(...record.sessions);
    state.notes.push(...record.notes);
    state.events.push(...record.events);
    revisions[row.id] = row.revision;
    accounts.push({ studentId: row.id, username: row.username, disabled: !!row.disabled_at });
  }
  return { state, revisions, accounts };
}

function validCommand(command: unknown): command is Command {
  if (!command || typeof command !== "object" || Array.isArray(command)) return false;
  const c = command as Record<string, unknown>;
  if (typeof c.studentId !== "string" || c.studentId.length > 100) return false;
  switch (c.type) {
    case "assess": return typeof c.skillId === "string" && typeof c.status === "string" && (c.reason === undefined || typeof c.reason === "string") && (c.guidance === undefined || typeof c.guidance === "string");
    case "assign": return typeof c.activityId === "string" && typeof c.minutes === "number" && typeof c.repetitions === "number";
    case "unlock": return typeof c.levelId === "string" && (c.overrideReason === undefined || typeof c.overrideReason === "string");
    case "saveNote": return typeof c.text === "string";
    case "completePractice": return typeof c.sessionId === "string" && c.sessionId.length > 0 && c.sessionId.length <= 100 && typeof c.durationSeconds === "number" && Array.isArray(c.itemIds) && c.itemIds.length <= 100 && c.itemIds.every((id) => typeof id === "string");
    default: return false;
  }
}

export async function handleLearning(request: Request, env: Env, account: AccountRow): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/state" && request.method === "GET") return json(await stateFor(account, env));
  if (pathname !== "/api/commands" || request.method !== "POST") return null;
  let input: {revision?:unknown; command?:unknown};
  try {
    const text = await request.text();
    if (text.length > 12_000) return json({ error: "Request is too large." }, 413);
    input = JSON.parse(text);
  } catch { return json({ error: "Invalid request." }, 400); }
  if (!input || !Number.isInteger(input.revision) || !validCommand(input.command)) return json({ error: "Invalid request." }, 400);
  const command = input.command;
  if (account.role === "student" && (account.id !== command.studentId || command.type !== "completePractice"))
    return json({ error: "This action is not available to this student." }, 403);
  const record = await getStudentRecord(env.DB, command.studentId);
  if (!record) return json({ error: "Student not found." }, 404);
  if (command.type === "completePractice" && record.state.sessions.some((session) => session.id === command.sessionId))
    return json({ state: account.role === "student" ? { ...record.state, notes: [] } : record.state, revision: record.revision });
  if (input.revision !== record.revision) return json({ error: "Progress changed. Reload and try again." }, 409);
  const actor: Actor = account.role === "teacher" ? { role: "teacher" } : { role: "student", studentId: account.id };
  const result = applyCommand(record.state, actor, { ...command, at: new Date().toISOString() });
  if (!result.ok) return json({ error: result.error }, 400);
  if (!(await saveStudentRecord(env.DB, command.studentId, record.revision, result.value)))
    return json({ error: "Progress changed. Reload and try again." }, 409);
  return json({ state: account.role === "student" ? { ...result.value, notes: [] } : result.value, revision: record.revision + 1 });
}
