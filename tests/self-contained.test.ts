import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";

// Raw text of every source file that could pull something from another origin
// or draw a character with a font the project does not ship.
const sources = import.meta.glob<string>("../src/**/*.{css,ts,js}", {
  query: "?raw",
  import: "default",
  eager: true,
});
const files: [string, string][] = [["index.html", indexHtml], ...Object.entries(sources)];

/**
 * Characters covered by the bundled fonts (their `unicode-range` in main.css):
 * Latin-1, general punctuation (— · …) and the minus sign from DM Sans / Space Grotesk, and
 * the Arabic letters and punctuation from Cairo. Anything else would be drawn by whatever
 * font the visitor's operating system happens to have.
 */
const COVERED_RANGES: readonly (readonly [number, number])[] = [
  [0x0000, 0x00ff], // Latin-1
  [0x2000, 0x206f], // general punctuation
  [0x2212, 0x2212], // minus sign
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic supplement
  [0x200c, 0x200e], // joiners and direction marks
  [0xfb50, 0xfdff], // Arabic presentation forms A
  [0xfe70, 0xfefc], // Arabic presentation forms B
];

function isCoveredByBundledFonts(char: string): boolean {
  const codePoint = char.codePointAt(0) ?? 0;
  return COVERED_RANGES.some(([first, last]) => codePoint >= first && codePoint <= last);
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
