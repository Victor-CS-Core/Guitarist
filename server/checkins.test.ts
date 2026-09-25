// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, expect, test } from "vitest";
import { studioTestServer, studentPassword, teacherPassword } from "./testSetup";
import { MAX_AUDIO_BASE64_CHARS } from "./checkins";

let setup: Awaited<ReturnType<typeof studioTestServer>>;
beforeEach(async () => {
  setup = await studioTestServer();
  const migration = await readFile(new URL("../drizzle/0001_checkins.sql", import.meta.url), "utf8");
  for (const statement of migration.replace(/--> statement-breakpoint/g, "").split(";").map((s) => s.trim()).filter(Boolean))
    await setup.env.DB.prepare(statement).run();
});
afterEach(async () => { await setup.mf.dispose(); });

const clip = (overrides: Record<string, unknown> = {}) => ({
  audioBase64: Buffer.from("fake-audio-bytes").toString("base64"),
  mime: "audio/webm",
  durationSeconds: 42,
  ...overrides,
});

async function studentCookie(name: string) {
  const teacher = await setup.signIn("Ktr0nn", teacherPassword);
  await setup.api("/api/students", "POST", { displayName: name, username: name.toLowerCase(), password: studentPassword }, teacher.cookie);
  return (await setup.signIn(name.toLowerCase(), studentPassword)).cookie;
}

test("student uploads a clip and plays it back; list carries metadata only", async () => {
  const cookie = await studentCookie("Alex");
  const created = await setup.api("/api/checkins", "POST", clip(), cookie);
  expect(created.status).toBe(201);
  const { id } = await created.json() as { id: string };
  expect(id).toBeTruthy();

  const list = await setup.api("/api/checkins", "GET", undefined, cookie);
  expect(list.status).toBe(200);
  const { checkins } = await list.json() as { checkins: Array<Record<string, unknown>> };
  expect(checkins).toHaveLength(1);
  expect(checkins[0]).toMatchObject({ id, mime: "audio/webm", durationSeconds: 42, studentName: "Alex" });
  expect(checkins[0]).not.toHaveProperty("audio_base64");
  expect(checkins[0]).not.toHaveProperty("audioBase64");

  const audio = await setup.api(`/api/checkins/${id}/audio`, "GET", undefined, cookie);
  expect(audio.status).toBe(200);
  expect(audio.headers.get("content-type")).toBe("audio/webm");
  expect(Buffer.from(await audio.arrayBuffer()).toString()).toBe("fake-audio-bytes");
}, 30000);

test("teacher sees every student's clips; students only see their own", async () => {
  const alex = await studentCookie("Alex");
  const sam = await studentCookie("Sam");
  const created = await setup.api("/api/checkins", "POST", clip(), alex);
  const { id } = await created.json() as { id: string };

  const samAudio = await setup.api(`/api/checkins/${id}/audio`, "GET", undefined, sam);
  expect(samAudio.status).toBe(404);
  const samList = await setup.api("/api/checkins", "GET", undefined, sam);
  expect(((await samList.json()) as { checkins: unknown[] }).checkins).toHaveLength(0);
  expect((await setup.api(`/api/checkins/${id}`, "DELETE", undefined, sam)).status).toBe(404);

  const teacher = (await setup.signIn("Ktr0nn", teacherPassword)).cookie;
  const teacherList = await setup.api("/api/checkins", "GET", undefined, teacher);
  const { checkins } = await teacherList.json() as { checkins: Array<{ studentName: string }> };
  expect(checkins).toHaveLength(1);
  expect(checkins[0].studentName).toBe("Alex");
  const teacherAudio = await setup.api(`/api/checkins/${id}/audio`, "GET", undefined, teacher);
  expect(teacherAudio.status).toBe(200);
  expect(Buffer.from(await teacherAudio.arrayBuffer()).toString()).toBe("fake-audio-bytes");
}, 30000);

test("teacher cannot record a check-in and anonymous callers get 401", async () => {
  const teacher = (await setup.signIn("Ktr0nn", teacherPassword)).cookie;
  expect((await setup.api("/api/checkins", "POST", clip(), teacher)).status).toBe(403);
  expect((await setup.api("/api/checkins", "GET")).status).toBe(401);
}, 30000);

test("upload validation rejects bad mime, duration, corrupted and oversized audio", async () => {
  const cookie = await studentCookie("Alex");
  expect((await setup.api("/api/checkins", "POST", clip({ mime: "audio/wav" }), cookie)).status).toBe(400);
  expect((await setup.api("/api/checkins", "POST", clip({ mime: "AUDIO/WEBM" }), cookie)).status).toBe(201);
  expect((await setup.api("/api/checkins", "POST", clip({ durationSeconds: 0 }), cookie)).status).toBe(400);
  expect((await setup.api("/api/checkins", "POST", clip({ durationSeconds: 91 }), cookie)).status).toBe(400);
  expect((await setup.api("/api/checkins", "POST", clip({ durationSeconds: 4.5 }), cookie)).status).toBe(400);
  expect((await setup.api("/api/checkins", "POST", clip({ audioBase64: "not valid base64!!" }), cookie)).status).toBe(400);
  expect((await setup.api("/api/checkins", "POST", clip({ audioBase64: "abc" }), cookie)).status).toBe(400);
  const huge = "A".repeat(MAX_AUDIO_BASE64_CHARS + 4);
  const oversized = await setup.api("/api/checkins", "POST", clip({ audioBase64: huge }), cookie);
  expect(oversized.status).toBe(413);
  const list = await setup.api("/api/checkins", "GET", undefined, cookie);
  expect(((await list.json()) as { checkins: unknown[] }).checkins).toHaveLength(1);
}, 30000);

test("student can delete their own clip", async () => {
  const cookie = await studentCookie("Alex");
  const { id } = await (await setup.api("/api/checkins", "POST", clip(), cookie)).json() as { id: string };
  expect((await setup.api(`/api/checkins/${id}`, "DELETE", undefined, cookie)).status).toBe(200);
  expect((await setup.api(`/api/checkins/${id}/audio`, "GET", undefined, cookie)).status).toBe(404);
  expect((await setup.api("/api/checkins/no-such-clip", "DELETE", undefined, cookie)).status).toBe(404);
}, 30000);
