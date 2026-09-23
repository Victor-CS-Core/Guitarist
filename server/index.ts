export interface Env {
  DB: D1Database;
  ADMIN_BOOTSTRAP_PASSWORD?: string;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
