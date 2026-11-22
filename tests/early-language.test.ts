import { describe, expect, it } from "vitest";
import earlyScript from "../public/early-language.js?raw";
import indexHtml from "../index.html?raw";
import { PREFERENCES_STORAGE_KEY } from "../src/storage/preferences";

describe("early language script", () => {
  it("reads the same storage key the app saves the language under", () => {
    expect(earlyScript).toContain(`"${PREFERENCES_STORAGE_KEY}"`);
  });

  it("only acts for English, so Arabic (the default) is never hidden", () => {
    expect(earlyScript).toContain('saved.language === "en"');
  });

  it("is loaded from the page before the styles, and as a plain relative file (works under any address)", () => {
    expect(indexHtml).toContain('<script src="early-language.js"></script>');
    expect(indexHtml.indexOf("early-language.js")).toBeLessThan(indexHtml.indexOf("main.css"));
  });
});
