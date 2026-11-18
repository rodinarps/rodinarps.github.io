import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import { iconMarkup, isIconName, type IconName } from "../src/ui/icons";

const ALL_ICONS: IconName[] = [
  "rock", "paper", "scissors", "party", "skull", "handshake", "trophy",
  "clock", "rows-3", "arrow-up-right", "arrow-right", "pause", "play", "rotate-cw", "house", "x", "sparkle",
];

describe("icons", () => {
  it.each(ALL_ICONS)("%s has an inline SVG file", (name) => {
    const markup = iconMarkup(name);
    expect(markup.startsWith("<svg")).toBe(true);
    expect(markup).toContain('class="icon"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toMatch(/<!--/); // license comments are stripped from the page
    expect(markup).not.toMatch(/https?:\/\//); // no xmlns URL inlined
    expect(markup).not.toMatch(/\sstyle=/); // inline styles would be blocked by the CSP
  });

  it("only keeps width/height on inner shapes, not on the root tag", () => {
    expect(iconMarkup("rows-3").match(/<svg[^>]*>/)?.[0]).not.toMatch(/\s(width|height)=/);
    expect(iconMarkup("rows-3")).toMatch(/<rect[^>]*width=/); // the shape itself is untouched
  });

  it("accepts only known icon names", () => {
    expect(isIconName("rock")).toBe(true);
    expect(isIconName("unicorn")).toBe(false);
  });

  it("every data-icon in index.html refers to a real icon", () => {
    const used = [...indexHtml.matchAll(/data-icon="([^"]+)"/g)].map((match) => match[1]);
    expect(used.length).toBeGreaterThan(10);
    for (const name of used) expect(isIconName(name)).toBe(true);
  });
});
