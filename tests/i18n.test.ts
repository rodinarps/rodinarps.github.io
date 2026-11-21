import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import { ar } from "../src/i18n/ar";
import { en } from "../src/i18n/en";
import { DEFAULT_LANGUAGE, DIRECTION, isLanguage, isMessageKey, otherLanguage, translate } from "../src/i18n";

const keys = Object.keys(en);
const placeholdersOf = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("translations", () => {
  it("has the same keys in both languages", () => {
    expect(Object.keys(ar).sort()).toEqual([...keys].sort());
  });

  it.each(keys)("%s is filled in and uses the same {placeholders} in both languages", (key) => {
    const english = (en as Record<string, string>)[key] as string;
    const arabic = (ar as Record<string, string>)[key] as string;
    expect(english.trim()).not.toBe("");
    expect(arabic.trim()).not.toBe("");
    expect(placeholdersOf(arabic)).toEqual(placeholdersOf(english));
  });

  it("has twelve month names in each language", () => {
    expect(en["date.months"].split(",")).toHaveLength(12);
    expect(ar["date.months"].split(",")).toHaveLength(12);
  });

  it("fills in placeholders, and leaves an unknown one empty", () => {
    expect(translate("en", "history.latest", { shown: 30, total: 41 })).toBe("Showing the latest 30 of 41 matches.");
    expect(translate("ar", "history.latest", { shown: 30, total: 41 })).toBe("عرض آخر 30 من 41 مباراة.");
    expect(translate("en", "history.latest", { shown: 30 })).toBe("Showing the latest 30 of  matches.");
  });
});

describe("languages", () => {
  it("defaults to Arabic, written right to left", () => {
    expect(DEFAULT_LANGUAGE).toBe("ar");
    expect(DIRECTION).toEqual({ ar: "rtl", en: "ltr" });
  });

  it("recognises language codes and swaps between the two", () => {
    expect(isLanguage("ar")).toBe(true);
    expect(isLanguage("fr")).toBe(false);
    expect(otherLanguage("ar")).toBe("en");
    expect(otherLanguage("en")).toBe("ar");
    expect(isMessageKey("msg.welcome")).toBe(true);
    expect(isMessageKey("msg.nope")).toBe(false);
  });
});

describe("index.html", () => {
  it("starts in Arabic, so the page is right before any script runs", () => {
    expect(indexHtml).toContain('<html lang="ar" dir="rtl">');
    expect(indexHtml).toContain(`<title>${ar["page.title"]}</title>`);
  });

  it("only uses text keys that exist", () => {
    const used = [...indexHtml.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)].map((match) => match[1]);
    expect(used.length).toBeGreaterThan(40);
    for (const key of used) expect(isMessageKey(key), key).toBe(true);
  });

  it("holds exactly the Arabic text for every translated element", () => {
    const elements = [...indexHtml.matchAll(/<(\w+)[^>]*\sdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)];
    expect(elements.length).toBeGreaterThan(40);
    for (const [, , key, text] of elements) {
      expect(text, key).toBe((ar as Record<string, string>)[key as string]);
    }
  });

  it("holds exactly the Arabic text for every translated accessible name", () => {
    const labelled = [...indexHtml.matchAll(/aria-label="([^"]*)"[^>]*\sdata-i18n-aria-label="([^"]+)"/g)];
    expect(labelled.length).toBeGreaterThan(10);
    for (const [, label, key] of labelled) {
      expect(label, key).toBe((ar as Record<string, string>)[key as string]);
    }
  });
});
