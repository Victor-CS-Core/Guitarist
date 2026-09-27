// Injects the build's asset list into dist/client/sw.js so the installed
// PWA precaches everything it needs and runs fully offline after one visit.
// Also versions the cache per build so updates propagate to installed apps.
//
// Placeholders in public/sw.js:
//   __BUILD_ID__            -> "guitarist-<12 hex chars>"
//   /*__PRECACHE__*/ [...]  -> JSON array of precache URLs
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

const OUT = "dist/client";
const SW = join(OUT, "sw.js");

async function collect(dir, base = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await collect(join(dir, entry.name), rel)));
    else if (entry.isFile() && entry.name !== "sw.js" && !entry.name.startsWith(".")) files.push(rel);
  }
  return files;
}

const files = (await collect(OUT)).sort();
if (files.length === 0) throw new Error(`no files found under ${OUT}`);
const urls = ["/", ...files.map((f) => `/${f}`)];
const buildId = `guitarist-${createHash("sha1").update(urls.join("\n")).digest("hex").slice(0, 12)}`;

let sw = await readFile(SW, "utf8");
if (!sw.includes("__BUILD_ID__") || !sw.includes("__PRECACHE__")) {
  throw new Error("sw.js is missing the __BUILD_ID__/__PRECACHE__ placeholders");
}
sw = sw.replace("__BUILD_ID__", buildId);
sw = sw.replace(/\/\*__PRECACHE__\*\/\s*\[[^\]]*\]/, JSON.stringify(urls));
await writeFile(SW, sw);
console.log(`sw.js: precaching ${urls.length} URLs as ${buildId}`);
