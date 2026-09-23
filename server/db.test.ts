// @vitest-environment node
import { afterEach, beforeEach, expect, test } from "vitest";
import { Miniflare } from "miniflare";
import { readFile } from "node:fs/promises";
import { createEmptyStudentState, getStudentRecord, saveStudentRecord } from "./db";

let mf: Miniflare;
let db: D1Database;

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok') } }",
    d1Databases: { DB: crypto.randomUUID() },
  });
  db = await mf.getD1Database("DB");
  const sql = await readFile(new URL("../drizzle/0000_accounts.sql", import.meta.url), "utf8");
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(statement).run();
  }
  await db.prepare("INSERT INTO accounts (id, username, username_key, role, password_salt, password_hash, password_iterations, display_name, created_at) VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)")
    .bind("student-1", "alex", "alex", "salt", "hash", 1, "Alex", new Date().toISOString())
    .run();
});

afterEach(async () => { await mf?.dispose(); });

test("student progress survives a fresh read and stale revisions cannot overwrite it", async () => {
  const initial = createEmptyStudentState("student-1", "Alex");
  expect(await saveStudentRecord(db, "student-1", 0, initial)).toBe(true);
  const changed = structuredClone(initial);
  changed.students[0].goal = "A new goal";
  expect(await saveStudentRecord(db, "student-1", 1, changed)).toBe(true);
  expect(await saveStudentRecord(db, "student-1", 1, initial)).toBe(false);
  const reloaded = await getStudentRecord(db, "student-1");
  expect(reloaded?.revision).toBe(2);
  expect(reloaded?.state.students[0].goal).toBe("A new goal");
});
