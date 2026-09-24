import { Miniflare } from "miniflare";
import { readFile } from "node:fs/promises";
import worker, { type Env } from "./index";

const origin = "https://guitarist.example";
export const teacherPassword = "example-test-password";
export const studentPassword = "example-student-password";

export async function studioTestServer() {
  const mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok') } }",
    d1Databases: { DB: crypto.randomUUID() },
  });
  const db = await mf.getD1Database("DB");
  const sql = await readFile(new URL("../drizzle/0000_accounts.sql", import.meta.url), "utf8");
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) await db.prepare(statement).run();
  const env: Env = { DB: db, ASSETS: { fetch: async () => new Response("spa entry") }, ADMIN_BOOTSTRAP_PASSWORD: teacherPassword };
  const api = (path: string, method = "GET", body?: unknown, cookie?: string) => worker.fetch(
    new Request(`${origin}${path}`, {
      method,
      headers: {
        ...(method === "GET" ? {} : { origin, "content-type": "application/json" }),
        ...(cookie ? { cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), env,
  );
  const signIn = async (username: string, password: string) => {
    const response = await api("/api/login", "POST", { username, password });
    return { response, cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
  };
  return { mf, env, api, signIn };
}
