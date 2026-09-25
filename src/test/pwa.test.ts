import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("PWA installability", () => {
  it("ships a valid web manifest with required fields and icons", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest"));
    expect(manifest.name).toBe("Guitarist");
    expect(manifest.short_name).toBe("Guitarist");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(
      manifest.icons.some((i: { purpose?: string }) =>
        (i.purpose ?? "").includes("maskable"),
      ),
    ).toBe(true);
    for (const icon of manifest.icons) {
      expect(existsSync(join(repoRoot, "public", icon.src))).toBe(true);
    }
  });

  it("ships a service worker that caches the app shell", () => {
    expect(existsSync(join(repoRoot, "public", "sw.js"))).toBe(true);
    const sw = read("public/sw.js");
    expect(sw).toContain("install");
    expect(sw).toContain("fetch");
    expect(sw).toContain("/index.html");
  });

  it("index.html links the manifest, icons, and iOS meta tags", () => {
    const html = read("index.html");
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("manifest.webmanifest");
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain("apple-mobile-web-app-capable");
    expect(html).toContain("viewport-fit=cover");
  });

  it("registers the service worker in production builds only", () => {
    const main = read("src/main.tsx");
    expect(main).toContain("serviceWorker");
    expect(main).toContain("import.meta.env.PROD");
  });
});
