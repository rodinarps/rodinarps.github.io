import { describe, expect, it } from "vitest";
import { capitalize, formatTimeLeft } from "../src/ui/format";
import { finalBanner, roundBanner } from "../src/ui/messages";

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
