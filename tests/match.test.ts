import { describe, expect, it } from "vitest";
import { Match } from "../src/core/match";

// A random source of 0 makes the computer's first moves always "rock".
const alwaysZero = () => 0;

describe("Match (rounds mode)", () => {
  it("scores rounds and finishes after the last one", () => {
    const match = new Match("rounds", 2);

    expect(match.playRound("paper", alwaysZero)?.result).toBe("win");
    expect(match.status).toBe("playing");
    expect(match.remaining).toBe(1);

    expect(match.playRound("scissors", alwaysZero)?.result).toBe("lose");
    expect(match.status).toBe("finished");
    expect(match.playerScore).toBe(1);
    expect(match.cpuScore).toBe(1);
    expect(match.verdict).toBe("tie");
    expect(match.progressPercent).toBe(100);
  });

  it("ignores rounds once finished", () => {
    const match = new Match("rounds", 1);
    match.playRound("rock", alwaysZero);
    expect(match.playRound("rock", alwaysZero)).toBeNull();
  });

  it("does not react to tick or pause", () => {
    const match = new Match("rounds", 3);
    match.tick();
    match.togglePause();
    expect(match.remaining).toBe(3);
    expect(match.status).toBe("playing");
  });
});

describe("Match (time mode)", () => {
  it("counts down in seconds and finishes at zero", () => {
    const match = new Match("time", 1);
    expect(match.total).toBe(60);

    for (let second = 0; second < 59; second += 1) match.tick();
    expect(match.status).toBe("playing");

    match.tick();
    expect(match.remaining).toBe(0);
    expect(match.status).toBe("finished");
  });

  it("stops counting and playing while paused", () => {
    const match = new Match("time", 1);
    match.togglePause();

    match.tick();
    expect(match.remaining).toBe(60);
    expect(match.playRound("rock", alwaysZero)).toBeNull();

    match.togglePause();
    expect(match.status).toBe("playing");
    expect(match.playRound("rock", alwaysZero)).not.toBeNull();
  });

  it("does not resume a finished match", () => {
    const match = new Match("time", 1);
    for (let second = 0; second < 60; second += 1) match.tick();
    match.togglePause();
    expect(match.status).toBe("finished");
  });
});

describe("Match validation", () => {
  it("rejects invalid settings", () => {
    expect(() => new Match("rounds", 0)).toThrow(RangeError);
    expect(() => new Match("time", 1.5)).toThrow(RangeError);
  });

  it("reports who is ahead", () => {
    const match = new Match("rounds", 5);
    expect(match.verdict).toBe("tie");
    match.playRound("paper", alwaysZero); // beats rock
    expect(match.verdict).toBe("win");
  });
});

describe("Match history of rounds", () => {
  it("remembers every round and when it started", () => {
    const startedAt = new Date("2026-11-18T12:00:00.000Z");
    const match = new Match("rounds", 3, startedAt);
    match.playRound("paper", alwaysZero);
    match.playRound("scissors", alwaysZero);

    expect(match.startedAt).toBe(startedAt);
    expect(match.rounds).toEqual([
      { playerChoice: "paper", cpuChoice: "rock", result: "win" },
      { playerChoice: "scissors", cpuChoice: "rock", result: "lose" },
    ]);
  });
});
