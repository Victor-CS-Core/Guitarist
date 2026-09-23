// @vitest-environment node
import { afterEach, beforeEach, expect, test } from "vitest";
import { studioTestServer, studentPassword, teacherPassword } from "./testSetup";

let setup: Awaited<ReturnType<typeof studioTestServer>>;
beforeEach(async () => { setup = await studioTestServer(); });
afterEach(async () => { await setup.mf.dispose(); });

test("teacher creates a student without email and usernames are case-insensitively unique", async () => {
  const { cookie } = await setup.signIn("Ktr0nn", teacherPassword);
  const first = await setup.api("/api/students", "POST", { displayName: "Alex", username: "alex", password: studentPassword }, cookie);
  expect(first.status).toBe(201);
  const created = await first.json() as { studentId: string };
  expect(created.studentId).toBeTruthy();
  const duplicate = await setup.api("/api/students", "POST", { displayName: "Other", username: "ALEX", password: studentPassword }, cookie);
  expect(duplicate.status).toBe(409);
  const account = await setup.env.DB.prepare("SELECT username, display_name FROM accounts WHERE id = ?").bind(created.studentId).first();
  expect(account).toEqual({ username: "alex", display_name: "Alex" });
  expect((await setup.signIn("alex", studentPassword)).response.status).toBe(200);
});

test("student cannot create accounts and teacher validation rejects invalid fields", async () => {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  const invalid = await setup.api("/api/students", "POST", { displayName: " ", username: "a", password: "short" }, teacher.cookie);
  expect(invalid.status).toBe(400);
  await setup.api("/api/students", "POST", { displayName: "Alex", username: "alex", password: studentPassword }, teacher.cookie);
  const student = await setup.signIn("alex", studentPassword);
  expect((await setup.api("/api/students", "POST", { displayName: "Sam", username: "sam", password: studentPassword }, student.cookie)).status).toBe(403);
});

test("teacher reset and disable immediately revoke student access", async () => {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  const created = await setup.api("/api/students", "POST", { displayName: "Alex", username: "alex", password: studentPassword }, teacher.cookie);
  const { studentId } = await created.json() as {studentId:string};
  const student = await setup.signIn("alex", studentPassword);
  const reset = await setup.api(`/api/students/${studentId}/credentials`, "PATCH", { password: "replacement-test-password" }, teacher.cookie);
  expect(reset.status).toBe(200);
  expect((await setup.api("/api/me", "GET", undefined, student.cookie)).status).toBe(401);
  expect((await setup.signIn("alex", studentPassword)).response.status).toBe(401);
  const replacement = await setup.signIn("alex", "replacement-test-password");
  expect(replacement.response.status).toBe(200);
  const disable = await setup.api(`/api/students/${studentId}/status`, "PATCH", { disabled: true }, teacher.cookie);
  expect(disable.status).toBe(200);
  expect((await setup.api("/api/me", "GET", undefined, replacement.cookie)).status).toBe(401);
  expect((await setup.signIn("alex", "replacement-test-password")).response.status).toBe(401);
});
