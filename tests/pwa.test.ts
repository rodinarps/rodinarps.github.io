import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import manifestText from "../public/manifest.webmanifest?raw";
import serviceWorkerTemplate from "../src/pwa/service-worker.js?raw";
import { renderServiceWorker, shouldPrecache, toPrecacheUrls } from "../build/precache-plugin";

const manifest = JSON.parse(manifestText) as {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  lang: string;
  icons: { src: string; sizes: string; type: string; purpose: string }[];
};
const iconFiles = Object.keys(import.meta.glob("../public/icons/*.png")).map((path) => path.replace("../public/", ""));

describe("web app manifest", () => {
  it("makes the game installable as a standalone app that opens from wherever it is hosted", () => {
    expect(manifest.name).toBe("RodinaRPS");
    expect(manifest.short_name).toBe("RodinaRPS");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("ar");
    // Relative, so it works on a user site (rodinarps.github.io) and under a project path alike.
    expect(manifest.start_url).toBe("./");
    expect(manifest.scope).toBe("./");
  });

  it("has the icon sizes browsers ask for, including one that can be cropped to any shape", () => {
    const sizes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose}`);
    expect(sizes).toContain("192x192:any");
    expect(sizes).toContain("512x512:any");
    expect(sizes).toContain("512x512:maskable");
  });

  it("only points at icon files that exist", () => {
    for (const icon of manifest.icons) expect(iconFiles, icon.src).toContain(icon.src);
    expect(iconFiles).toContain("icons/apple-touch-icon.png");
  });
});

describe("index.html", () => {
  it("links the manifest and the iPhone home screen icon", () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable"');
  });

  it("has an install button that stays hidden until the browser offers installing", () => {
    expect(indexHtml).toMatch(/<button[^>]*id="install-button"[^>]*\shidden/);
  });
});

describe("service worker template", () => {
  it("has each build-time marker exactly once", () => {
    expect(serviceWorkerTemplate.split('"__VERSION__"')).toHaveLength(2);
    expect(serviceWorkerTemplate.split("/*PRECACHE_URLS*/ []")).toHaveLength(2);
  });

  it("only talks to its own site", () => {
    expect(serviceWorkerTemplate).not.toMatch(/https?:\/\//);
    expect(serviceWorkerTemplate).toContain("origin !== self.location.origin");
  });

  it("is filled in with the version and the files, and is still valid JavaScript", () => {
    const urls = ["./", "./index.html", "./assets/app-abc.js"];
    const output = renderServiceWorker(serviceWorkerTemplate, urls, "abc123def456");

    expect(output).toContain('const VERSION = "abc123def456";');
    for (const url of urls) expect(output).toContain(JSON.stringify(url));
    expect(output).not.toContain("__VERSION__");
    expect(output).not.toContain("PRECACHE_URLS*/");
    expect(() => new Function(output)).not.toThrow();
  });

  it("refuses to build when a marker is missing instead of shipping a worker with no files", () => {
    expect(() => renderServiceWorker("const nothing = 1;", [], "v")).toThrow(/marker/);
  });
});

describe("what gets stored for offline use", () => {
  it("stores the game's files but not the worker itself, license texts or source maps", () => {
    expect(shouldPrecache("index.html")).toBe(true);
    expect(shouldPrecache("assets/index-abc.js")).toBe(true);
    expect(shouldPrecache("icons/icon-192.png")).toBe(true);
    expect(shouldPrecache("manifest.webmanifest")).toBe(true);
    expect(shouldPrecache("sw.js")).toBe(false);
    expect(shouldPrecache("licenses/DM-Sans-OFL.txt")).toBe(false);
    expect(shouldPrecache("assets/index-abc.js.map")).toBe(false);
  });

  it("lists the page itself first, then every file in a stable order", () => {
    expect(toPrecacheUrls(["sw.js", "index.html", "assets/b.js", "assets/a.css", "licenses/x.txt"])).toEqual([
      "./",
      "./assets/a.css",
      "./assets/b.js",
      "./index.html",
    ]);
  });
});
