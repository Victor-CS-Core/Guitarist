// @vitest-environment node
import { afterEach, beforeEach, expect, test } from "vitest";
import { Miniflare } from "miniflare";
import { readFile } from "node:fs/promises";
import worker, { type Env } from "./index";

const origin = "https://guitarist.example";
const testPassword = "example-test-password";
let mf: Miniflare;
let env: Env;

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok') } }",
    d1Databases: { DB: crypto.randomUUID() },
  });
  const db = await mf.getD1Database("DB");
  const sql = await readFile(new URL("../drizzle/0000_accounts.sql", import.meta.url), "utf8");
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(statement).run();
  }
  env = { DB: db, ASSETS: { fetch: async () => new Response("spa entry") }, ADMIN_BOOTSTRAP_PASSWORD: testPassword };
});
afterEach(async () => { await mf?.dispose(); });

function request(path: string, method = "GET", body?: unknown, cookie?: string, from = origin) {
  return new Request(`${origin}${path}`, {
    method,
    headers: {
      ...(method !== "GET" ? { origin: from, "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function login(password = testPassword) {
  return worker.fetch(request("/api/login", "POST", { username: "Ktr0nn", password }), env);
}

test("teacher bootstraps once and receives an opaque, secure, revocable session", async () => {
  const response = await login();
  expect(response.status).toBe(200);
  expect(response.headers.get("set-cookie")).toMatch(/HttpOnly; Secure; SameSite=Lax; Path=\//);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.text();
  expect(body).toContain('"role":"teacher"');
  expect(body).not.toContain(testPassword);
  expect(body).not.toContain("password_hash");
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  expect((await worker.fetch(request("/api/me", "GET", undefined, cookie), env)).status).toBe(200);
  expect((await worker.fetch(request("/api/logout", "POST", {}, cookie), env)).status).toBe(200);
  expect((await worker.fetch(request("/api/me", "GET", undefined, cookie), env)).status).toBe(401);
  env.ADMIN_BOOTSTRAP_PASSWORD = undefined;
  expect((await login()).status).toBe(200);
});

test("direct SPA deep links serve the app entry document", async () => {
  let requested = "";
  env.ASSETS = { fetch: async (request: Request) => {
    requested = new URL(request.url).pathname;
    return new Response("spa entry");
  } };
  const response = await worker.fetch(new Request(`${origin}/student/progress`, { headers: { accept: "text/html" } }), env);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("spa entry");
  expect(requested).toBe("/index.html");
});

test("wrong passwords are generic and repeated attempts block even a correct password", async () => {
  for (let i = 0; i < 5; i++) {
    const response = await login("wrong-password");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid username or password." });
  }
  expect((await login()).status).toBe(429);
});

test("simultaneous failures consume the same durable rate limit", async () => {
  expect((await login()).status).toBe(200);
  const responses = await Promise.all(Array.from({ length: 8 }, () => login("wrong-password")));
  const statuses = responses.map((response) => response.status);
  expect(statuses.filter((status) => status === 401).length).toBeLessThanOrEqual(5);
  expect(statuses.filter((status) => status === 429).length).toBeGreaterThanOrEqual(3);
  expect((await login()).status).toBe(429);
});

test("mutations reject a foreign Origin and non-JSON content", async () => {
  const foreign = await worker.fetch(request("/api/login", "POST", { username: "Ktr0nn", password: testPassword }, undefined, "https://other.example"), env);
  expect(foreign.status).toBe(403);
  const wrongType = new Request(`${origin}/api/login`, { method: "POST", headers: { origin, "content-type": "text/plain" }, body: "hello" });
  expect((await worker.fetch(wrongType, env)).status).toBe(415);
});

test("disabled accounts cannot use existing cookies", async () => {
  const cookie = (await login()).headers.get("set-cookie")!.split(";")[0];
  await env.DB.prepare("UPDATE accounts SET disabled_at = ? WHERE username_key = ?")
    .bind(new Date().toISOString(), "ktr0nn").run();
  expect((await worker.fetch(request("/api/me", "GET", undefined, cookie), env)).status).toBe(401);
});
