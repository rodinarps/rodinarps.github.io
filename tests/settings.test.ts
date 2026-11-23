import { describe, expect, it } from "vitest";
import { MODE_CONFIG } from "../src/core/constants";
import { isCountedMode, normalizeDigits, validateSetting } from "../src/core/settings";

describe("mode limits", () => {
  it("offers 10, 30, 60 and 90 rounds", () => {
    expect(MODE_CONFIG.rounds.presets).toEqual([10, 30, 60, 90]);
  });

  it("lets you type any number up to the highest quick choice, and a bit beyond", () => {
    expect(MODE_CONFIG.rounds.max).toBeGreaterThanOrEqual(Math.max(...MODE_CONFIG.rounds.presets));
    expect(MODE_CONFIG.rounds.max).toBe(100);
  });

  it.each(["time", "rounds"] as const)("keeps every %s quick choice and the default inside its own limits", (mode) => {
    const { presets, defaultValue, min, max } = MODE_CONFIG[mode];
    for (const value of [...presets, defaultValue]) {
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  });

  it("knows which modes take a number", () => {
    expect(isCountedMode("time")).toBe(true);
    expect(isCountedMode("rounds")).toBe(true);
    expect(isCountedMode("free")).toBe(false);
  });
});

describe("validateSetting", () => {
  it("accepts whole numbers inside the limits, including the limits themselves", () => {
    expect(validateSetting("rounds", "1")).toEqual({ ok: true, value: 1 });
    expect(validateSetting("rounds", "50")).toEqual({ ok: true, value: 50 });
    expect(validateSetting("rounds", "90")).toEqual({ ok: true, value: 90 });
    expect(validateSetting("rounds", "100")).toEqual({ ok: true, value: 100 });
    expect(validateSetting("time", "60")).toEqual({ ok: true, value: 60 });
  });

  it("rejects a number that is too big instead of quietly lowering it", () => {
    expect(validateSetting("rounds", "101")).toEqual({ ok: false });
    expect(validateSetting("rounds", "500")).toEqual({ ok: false });
    expect(validateSetting("time", "61")).toEqual({ ok: false });
    expect(validateSetting("time", "99999999999999999999")).toEqual({ ok: false });
  });

  it("rejects a number that is too small", () => {
    expect(validateSetting("rounds", "0")).toEqual({ ok: false });
    expect(validateSetting("time", "0")).toEqual({ ok: false });
  });

  it.each(["", "   ", "abc", "5.5", "-3", "+5", "1e2", "0x10", "10 20", "٣.٠"])("rejects %j", (typed) => {
    expect(validateSetting("rounds", typed)).toEqual({ ok: false });
  });

  it("understands the digits Arabic and Persian keyboards type", () => {
    expect(validateSetting("rounds", "٣٠")).toEqual({ ok: true, value: 30 });
    expect(validateSetting("rounds", "۹۰")).toEqual({ ok: true, value: 90 });
    expect(validateSetting("rounds", "١٠١")).toEqual({ ok: false });
    expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩ ۰۱۲۳۴۵۶۷۸۹ 0-9")).toBe("0123456789 0123456789 0-9");
  });

  it("ignores spaces around a good number", () => {
    expect(validateSetting("rounds", "  30 ")).toEqual({ ok: true, value: 30 });
  });
});
