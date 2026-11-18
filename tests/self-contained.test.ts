import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";

// Raw text of every source file that could pull something from another origin
// or draw a character with a font the project does not ship.
const sources = import.meta.glob<string>("../src/**/*.{css,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
});
const files: [string, string][] = [["index.html", indexHtml], ...Object.entries(sources)];

/**
 * Characters covered by the bundled fonts (their `unicode-range` in main.css):
 * Latin-1, general punctuation (— · …) and the minus sign. Anything else would be
 * drawn by whatever font the visitor's operating system happens to have.
 */
function isCoveredByBundledFonts(char: string): boolean {
  const codePoint = char.codePointAt(0) ?? 0;
  return codePoint <= 0xff || (codePoint >= 0x2000 && codePoint <= 0x206f) || codePoint === 0x2212;
}

describe("self-contained project", () => {
  it("scans the expected files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)("%s makes no external requests", (_name, content) => {
    expect(content).not.toMatch(/https?:\/\//);
    expect(content).not.toMatch(/@import/);
    expect(content).not.toMatch(/(^|[^\w:])\/\/[a-z0-9-]+\.[a-z.]{2,}\//i); // protocol-relative URLs
  });

  it.each(files)("%s uses no emoji or symbols that depend on system fonts", (_name, content) => {
    const unsupported = [...new Set([...content].filter((char) => !isCoveredByBundledFonts(char)))];
    expect(unsupported).toEqual([]); // use an SVG icon (src/assets/icons) instead
  });
});
