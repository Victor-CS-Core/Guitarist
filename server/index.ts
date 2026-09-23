import { handleAuth, json } from "./auth";
import { handleStudents } from "./students";
import { handleLearning } from "./commands";
import { requireSession } from "./sessions";

export interface Env {
  DB: D1Database;
  ADMIN_BOOTSTRAP_PASSWORD?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      if (request.method !== "GET") {
        if (request.headers.get("origin") !== new URL(request.url).origin)
          return json({ error: "Invalid origin." }, 403);
        if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
          return json({ error: "JSON required." }, 415);
      }
      const auth = await handleAuth(request, env);
      if (auth) return auth;
      const account = await requireSession(request, env);
      if (!account) return json({ error: "Sign in required." }, 401);
      return (await handleStudents(request, env, account))
        ?? (await handleLearning(request, env, account))
        ?? json({ error: "Not found" }, 404);
    }
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
