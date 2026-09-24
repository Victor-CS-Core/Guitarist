import { readdir, rm } from "node:fs/promises";

// Cloudflare's Vite plugin copies local development secrets into the Worker
// output. They are only for local development and must never enter a Sites
// deployment archive.
for (const file of await readdir("dist/server")) {
  if (file === ".dev.vars" || file.startsWith(".dev.vars.")) {
    await rm(`dist/server/${file}`);
  }
}
