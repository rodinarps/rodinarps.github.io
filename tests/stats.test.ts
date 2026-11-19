import { describe, expect, it } from "vitest";
import { computeStats } from "../src/core/stats";
import type { MatchRecord } from "../src/core/types";

function record(overrides: Partial<MatchRecord>): MatchRecord {
  return {
    version: 1,
    id: Math.random().toString(),
    startedAt: "2026-11-18T12:00:00.000Z",
    mode: "rounds",
    setting: 2,
    playerScore: 0,
    cpuScore: 0,
    rounds: "",
    ...overrides,
  };
}

describe("computeStats", () => {
  it("is all zeros for an empty history", () => {
    const stats = computeStats([]);
    expect(stats.matches).toBe(0);
    expect(stats.rounds).toBe(0);
    expect(stats.favoriteMove).toBeNull();
    expect(stats.moves.rock).toEqual({ played: 0, won: 0 });
  });

  it("counts matches by result", () => {
    const stats = computeStats([
      record({ playerScore: 3, cpuScore: 1 }),
      record({ playerScore: 0, cpuScore: 2 }),
      record({ playerScore: 2, cpuScore: 2 }),
      record({ playerScore: 5, cpuScore: 0 }),
    ]);
    expect(stats).toMatchObject({ matches: 4, matchWins: 2, matchLosses: 1, matchTies: 1 });
  });

  it("counts rounds and how each move did", () => {
    // rock vs scissors (win), paper vs scissors (lose), paper vs rock (win), rock vs rock (tie)
    const stats = computeStats([record({ rounds: "rsps" + "pr" + "rr" })]);
    expect(stats).toMatchObject({ rounds: 4, roundWins: 2, roundLosses: 1, roundTies: 1 });
    expect(stats.moves.rock).toEqual({ played: 2, won: 1 });
    expect(stats.moves.paper).toEqual({ played: 2, won: 1 });
    expect(stats.moves.scissors).toEqual({ played: 0, won: 0 });
  });

  it("finds the favourite move across matches, ties going to rock, paper, scissors order", () => {
    expect(computeStats([record({ rounds: "ssspsp" })]).favoriteMove).toBe("scissors");
    expect(computeStats([record({ rounds: "ppss" })]).favoriteMove).toBe("paper");
  });
});
