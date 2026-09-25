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

test("teacher can unlock the app for a student; students cannot", async () => {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  const alex = await createStudent(teacher.cookie, "alex2");
  const student = await setup.signIn("alex2", studentPassword);
  const denied = await setup.api("/api/commands", "POST", { revision: 1, command: { type: "setAppUnlocked", studentId: alex, unlocked: true } }, student.cookie);
  expect(denied.status).toBe(403);
  const ok = await setup.api("/api/commands", "POST", { revision: 1, command: { type: "setAppUnlocked", studentId: alex, unlocked: true } }, teacher.cookie);
  expect(ok.status).toBe(200);
  const state = await setup.api("/api/state", "GET", undefined, student.cookie);
  expect(state.status).toBe(200);
  expect(await state.text()).toContain("\"appUnlocked\":true");
});

test("practice routines: teacher shares, graduate builds, locked student is blocked", async () => {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  const alex = await createStudent(teacher.cookie, "alex3");
  const student = await setup.signIn("alex3", studentPassword);
  const blocks = [{ id: "b1", kind: "warmup", title: "Stretch", minutes: 2 }];
  const cmd = (command: object, revision: number, cookie: string) =>
    setup.api("/api/commands", "POST", { revision, command }, cookie);

  // Locked student cannot build their own routine.
  expect((await cmd({ type: "createRoutine", studentId: alex, name: "Mine", blocks }, 1, student.cookie)).status).toBe(400);

  // Teacher shares one.
  const shared = await cmd({ type: "createRoutine", studentId: alex, name: "Teacher flow", blocks }, 1, teacher.cookie);
  expect(shared.status).toBe(200);
  const sharedBody = (await shared.json()) as { state: { routines: { id: string; createdBy: string }[] } };
  expect(sharedBody.state.routines).toHaveLength(1);
  expect(sharedBody.state.routines[0].createdBy).toBe("teacher");
  const sharedId = sharedBody.state.routines[0].id;

  // Locked student cannot delete the teacher's routine, but can play it.
  expect((await cmd({ type: "deleteRoutine", studentId: alex, routineId: sharedId }, 2, student.cookie)).status).toBe(400);
  const played = await cmd(
    { type: "completePractice", studentId: alex, sessionId: crypto.randomUUID(), durationSeconds: 130, itemIds: [], routineId: sharedId, label: "Teacher flow" },
    2,
    student.cookie,
  );
  expect(played.status).toBe(200);

  // After graduation the student can build their own.
  const unlock = await cmd({ type: "setAppUnlocked", studentId: alex, unlocked: true }, 3, teacher.cookie);
  expect(unlock.status).toBe(200);
  const own = await cmd({ type: "createRoutine", studentId: alex, name: "My flow", blocks }, 4, student.cookie);
  expect(own.status).toBe(200);
  const ownBody = (await own.json()) as { state: { routines: { id: string; createdBy: string }[] } };
  expect(ownBody.state.routines.some((r) => r.createdBy === "student")).toBe(true);
});
