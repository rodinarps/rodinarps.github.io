import { describe, expect, it } from "vitest";
import {
  capitalize,
  describeMatchSetup,
  formatBackupFileName,
  formatMatchDate,
  formatPercent,
  formatTimeLeft,
} from "../src/ui/format";
import { finalBanner, importMessage, roundBanner } from "../src/ui/messages";

describe("formatTimeLeft", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatTimeLeft(600)).toBe("10m 00s");
    expect(formatTimeLeft(65)).toBe("1m 05s");
    expect(formatTimeLeft(0)).toBe("0m 00s");
  });
});

describe("capitalize", () => {
  it("upper-cases the first letter", () => {
    expect(capitalize("rock")).toBe("Rock");
  });
});

describe("banners", () => {
  it("describes a round", () => {
    const banner = roundBanner({ playerChoice: "paper", cpuChoice: "rock", result: "win" });
    expect(banner).toEqual({
      message: "You Win!  Paper beats Rock",
      tone: "win",
      icon: "party",
    });
  });

  it("describes the final score", () => {
    expect(finalBanner(0, 0).message).toBe("Game Over! No scores recorded.");
    expect(finalBanner(3, 1)).toEqual({ message: "You Win!  3 — 1", tone: "win", icon: "trophy" });
    expect(finalBanner(1, 3).tone).toBe("lose");
    expect(finalBanner(2, 2).message).toBe("It's a Tie!  2 — 2");
  });
});

describe("formatPercent", () => {
  it("rounds to a whole percent and shows a dash for nothing", () => {
    expect(formatPercent(3, 8)).toBe("38%");
    expect(formatPercent(1, 3)).toBe("33%");
    expect(formatPercent(0, 5)).toBe("0%");
    expect(formatPercent(0, 0)).toBe("—");
  });
});

describe("history formatting", () => {
  it("formats a match date in the local time zone", () => {
    const iso = new Date(2026, 10, 18, 14, 5).toISOString();
    expect(formatMatchDate(iso)).toBe("18 Nov 2026 · 14:05");
  });

  it("describes how a match was set up", () => {
    expect(describeMatchSetup("time", 10)).toBe("Time · 10 min");
    expect(describeMatchSetup("rounds", 20)).toBe("Rounds · 20");
  });

  it("names backup files by date", () => {
    expect(formatBackupFileName(new Date(2026, 10, 8))).toBe("rodinarps-history-2026-11-08.json");
  });

  it("summarises an import", () => {
    expect(importMessage({ added: 1, duplicates: 0, invalid: 0 })).toBe("Imported 1 match.");
    expect(importMessage({ added: 4, duplicates: 2, invalid: 1 })).toBe(
      "Imported 4 matches · 2 already saved · 1 skipped as damaged.",
    );
  });
});
