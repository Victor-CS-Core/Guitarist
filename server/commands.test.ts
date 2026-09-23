// @vitest-environment node
import { afterEach, beforeEach, expect, test } from "vitest";
import { studioTestServer, studentPassword, teacherPassword } from "./testSetup";

let setup: Awaited<ReturnType<typeof studioTestServer>>;
beforeEach(async () => { setup = await studioTestServer(); });
afterEach(async () => { await setup.mf.dispose(); });

async function createStudent(cookie: string, username: string) {
  const response = await setup.api("/api/students", "POST", { displayName: username, username, password: studentPassword }, cookie);
  return (await response.json() as {studentId:string}).studentId;
}

test("student sees only their own record and cannot issue teacher or cross-student commands", async () => {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  const alex = await createStudent(teacher.cookie, "alex");
  const sam = await createStudent(teacher.cookie, "sam");
  const note = await setup.api("/api/commands", "POST", { revision: 1, command: { type: "saveNote", studentId: alex, text: "Private teaching note" } }, teacher.cookie);
  expect(note.status).toBe(200);
  const student = await setup.signIn("alex", studentPassword);
  const state = await setup.api("/api/state", "GET", undefined, student.cookie);
  expect(state.status).toBe(200);
  const body = await state.text();
  expect(body).toContain(alex);
  expect(body).not.toContain(sam);
  expect(body).not.toContain("Private teaching note");
  expect((await setup.api("/api/commands", "POST", { revision: 2, command: { type: "assess", studentId: alex, skillId: "guitar-parts", status: "MASTERED" } }, student.cookie)).status).toBe(403);
  expect((await setup.api("/api/commands", "POST", { revision: 1, command: { type: "completePractice", studentId: sam, sessionId: crypto.randomUUID(), durationSeconds: 30, itemIds: [] } }, student.cookie)).status).toBe(403);
});

test("practice persists, duplicate sessions are idempotent, and stale changes conflict", async () => {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  const alex = await createStudent(teacher.cookie, "alex");
  const assign = await setup.api("/api/commands", "POST", { revision: 1, command: { type: "assign", studentId: alex, activityId: "parts", minutes: 2, repetitions: 2 } }, teacher.cookie);
  expect(assign.status).toBe(200);
  const student = await setup.signIn("alex", studentPassword);
  const state = await (await setup.api("/api/state", "GET", undefined, student.cookie)).json() as {state:{assignments:{items:{id:string}[]}[]};revisions:Record<string,number>};
  const command = { type: "completePractice", studentId: alex, sessionId: crypto.randomUUID(), durationSeconds: 45, itemIds: [state.state.assignments[0].items[0].id] };
  const first = await setup.api("/api/commands", "POST", { revision: state.revisions[alex], command }, student.cookie);
  expect(first.status).toBe(200);
  expect((await setup.api("/api/commands", "POST", { revision: state.revisions[alex], command }, student.cookie)).status).toBe(200);
  expect((await setup.api("/api/commands", "POST", { revision: state.revisions[alex], command: { ...command, sessionId: crypto.randomUUID() } }, student.cookie)).status).toBe(409);
  const reload = await (await setup.api("/api/state", "GET", undefined, student.cookie)).json() as {state:{sessions:unknown[]}};
  expect(reload.state.sessions).toHaveLength(1);
});
