import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";

/** Files that make up the game are stored for offline use. The license texts and the worker itself are not. */
export function shouldPrecache(path: string): boolean {
  if (path === "sw.js") return false;
  if (path.startsWith("licenses/")) return false;
  return !path.endsWith(".map");
}

/** Addresses the service worker stores, relative to its own. "./" is the page itself. */
export function toPrecacheUrls(files: readonly string[]): string[] {
  return ["./", ...files.filter(shouldPrecache).sort().map((file) => `./${file}`)];
}

function replaceOnce(text: string, marker: string, value: string): string {
  if (!text.includes(marker)) throw new Error(`The service worker template is missing the marker ${marker}`);
  return text.replace(marker, () => value);
}

/** Fills the two markers of src/pwa/service-worker.js. */
export function renderServiceWorker(template: string, urls: readonly string[], version: string): string {
  const withVersion = replaceOnce(template, '"__VERSION__"', JSON.stringify(version));
  return replaceOnce(withVersion, "/*PRECACHE_URLS*/ []", JSON.stringify(urls, null, 2));
}

/** Every file under `directory`, as paths relative to it with forward slashes. */
function listFiles(directory: string, prefix = ""): string[] {
  return readdirSync(join(directory, prefix), { withFileTypes: true }).flatMap((entry) => {
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    return entry.isDirectory() ? listFiles(directory, path) : [path];
  });
}

/**
 * After the build, writes dist/sw.js: the service worker with the list of every file in the game
 * and a version made from their contents, so each release gets its own cache.
 */
export function precacheServiceWorker(): Plugin {
  let root = "";
  let outDir = "";

  return {
    name: "precache-service-worker",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = listFiles(outDir).filter(shouldPrecache);

      const hash = createHash("sha256");
      for (const file of [...files].sort()) hash.update(file).update("\0").update(readFileSync(join(outDir, file)));
      const version = hash.digest("hex").slice(0, 12);

      const template = readFileSync(resolve(root, "src/pwa/service-worker.js"), "utf-8");
      writeFileSync(join(outDir, "sw.js"), renderServiceWorker(template, toPrecacheUrls(files), version));
    },
  };
}
