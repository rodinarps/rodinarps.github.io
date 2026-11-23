import { beforeEach, describe, expect, it } from "vitest";
import { setLanguage } from "../src/i18n";
import {
  describeMatchSetup,
  formatBackupFileName,
  formatMatchDate,
  formatPercent,
  formatTimeLeft,
} from "../src/ui/format";
import { buildBanner, finalBanner, importMessage, roundBanner } from "../src/ui/messages";

describe("in English", () => {
  beforeEach(() => setLanguage("en"));

  it("formats the time left", () => {
    expect(formatTimeLeft(600)).toBe("10m 00s");
    expect(formatTimeLeft(65)).toBe("1m 05s");
    expect(formatTimeLeft(0)).toBe("0m 00s");
  });

  it("describes a round", () => {
    expect(roundBanner({ playerChoice: "paper", aiChoice: "rock", result: "win" })).toEqual({
      message: "You Win!  Paper beats Rock",
      tone: "win",
      icon: "party",
    });
    expect(roundBanner({ playerChoice: "rock", aiChoice: "paper", result: "lose" })).toEqual({
      message: "You Lose!  Paper beats Rock",
      tone: "lose",
      icon: "skull",
    });
    expect(roundBanner({ playerChoice: "scissors", aiChoice: "scissors", result: "tie" }).message).toBe(
      "Tie!  Both chose Scissors",
    );
  });

  it("describes the final score and calls the opponent the AI", () => {
    expect(finalBanner(0, 0).message).toBe("Game Over! No scores recorded.");
    expect(finalBanner(3, 1)).toEqual({ message: "You Win!  3 — 1", tone: "win", icon: "trophy" });
    expect(finalBanner(1, 3)).toEqual({ message: "AI Wins!  1 — 3", tone: "lose" });
    expect(finalBanner(2, 2).message).toBe("It's a Tie!  2 — 2");
  });

  it("builds the banner from its state, so it can be written again in another language", () => {
    expect(buildBanner({ kind: "welcome" }).message).toBe("Welcome! Choose a game mode to get started.");
    expect(buildBanner({ kind: "paused" }).tone).toBe("neutral");
    expect(buildBanner({ kind: "final", playerScore: 2, aiScore: 1 }).message).toBe("You Win!  2 — 1");
  });

  it("formats dates and match setups", () => {
    const iso = new Date(2026, 10, 18, 14, 5).toISOString();
    expect(formatMatchDate(iso)).toBe("18 Nov 2026 · 14:05");
    expect(describeMatchSetup("time", 10)).toBe("Time · 10 min");
    expect(describeMatchSetup("rounds", 20)).toBe("Rounds · 20");
    expect(describeMatchSetup("free", 0)).toBe("Free play");
  });

  it("summarises an import", () => {
    expect(importMessage({ added: 1, duplicates: 0, invalid: 0 })).toBe("Imported matches: 1.");
    expect(importMessage({ added: 4, duplicates: 2, invalid: 1 })).toBe(
      "Imported matches: 4 · 2 already saved · 1 skipped as damaged.",
    );
  });
});

describe("in Arabic", () => {
  beforeEach(() => setLanguage("ar"));

  it("formats the time left with a colon", () => {
    expect(formatTimeLeft(600)).toBe("10:00");
    expect(formatTimeLeft(65)).toBe("1:05");
  });

  it("uses the right verb for each move (rock and scissors are masculine, paper is feminine)", () => {
    expect(roundBanner({ playerChoice: "paper", aiChoice: "rock", result: "win" }).message).toBe("فزت! ورقة تهزم حجر");
    expect(roundBanner({ playerChoice: "rock", aiChoice: "scissors", result: "win" }).message).toBe("فزت! حجر يهزم مقص");
    expect(roundBanner({ playerChoice: "rock", aiChoice: "paper", result: "lose" }).message).toBe("خسرت! ورقة تهزم حجر");
    expect(roundBanner({ playerChoice: "scissors", aiChoice: "scissors", result: "tie" }).message).toBe(
      "تعادل! كلاكما اختار مقص",
    );
  });

  it("describes the final score", () => {
    expect(finalBanner(3, 1).message).toBe("فزت! 3 — 1");
    expect(finalBanner(1, 3).message).toBe("فاز الذكاء الاصطناعي! 1 — 3");
  });

  it("formats dates and match setups with Arabic month names and Western digits", () => {
    const iso = new Date(2026, 10, 18, 14, 5).toISOString();
    expect(formatMatchDate(iso)).toBe("18 نوفمبر 2026 · 14:05");
    expect(describeMatchSetup("time", 10)).toBe("الوقت · 10 د");
    expect(describeMatchSetup("rounds", 20)).toBe("الجولات · 20");
    expect(describeMatchSetup("free", 0)).toBe("لعب حر");
  });
});

describe("language independent helpers", () => {
  it("rounds a share to a whole percent and shows a dash for nothing", () => {
    expect(formatPercent(3, 8)).toBe("38%");
    expect(formatPercent(1, 3)).toBe("33%");
    expect(formatPercent(0, 5)).toBe("0%");
    expect(formatPercent(0, 0)).toBe("—");
  });

  it("names backup files by date", () => {
    expect(formatBackupFileName(new Date(2026, 10, 8))).toBe("rodinarps-history-2026-11-08.json");
  });
});
