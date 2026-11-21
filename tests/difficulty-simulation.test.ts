import { describe, expect, it } from "vitest";
import { CHOICES } from "../src/core/constants";
import { chooseAiMove } from "../src/core/opponent";
import { determineRoundResult } from "../src/core/rules";
import type { Choice, Difficulty, RoundPair } from "../src/core/types";

/** Small seeded random generator, so these simulations give the same numbers every time. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

type Player = (history: readonly RoundPair[], random: () => number) => Choice;

const randomPlayer: Player = (_history, random) => CHOICES[Math.floor(random() * 3)] as Choice;
const alwaysRock: Player = () => "rock";
const cyclePlayer: Player = (history) => CHOICES[history.length % 3] as Choice;

/** Share of rounds the AI wins against a simulated player. */
function aiWinRate(level: Difficulty, player: Player, rounds = 1500, seed = 7): number {
  const random = seededRandom(seed);
  const history: RoundPair[] = [];
  let aiWins = 0;
  for (let round = 0; round < rounds; round += 1) {
    const playerChoice = player(history, random);
    const aiChoice = chooseAiMove(history, level, random);
    history.push({ playerChoice, aiChoice });
    if (determineRoundResult(playerChoice, aiChoice) === "lose") aiWins += 1;
  }
  return aiWins / rounds;
}

describe("difficulty levels against simulated players", () => {
  it("nobody beats a random player: every level wins about a third of the time", () => {
    for (const level of ["easy", "medium", "hard", "extreme"] as const) {
      expect(aiWinRate(level, randomPlayer)).toBeGreaterThan(0.28);
      expect(aiWinRate(level, randomPlayer)).toBeLessThan(0.39);
    }
  });

  it("easy does not punish a predictable player, medium does", () => {
    expect(aiWinRate("easy", alwaysRock)).toBeLessThan(0.45);
    expect(aiWinRate("medium", alwaysRock)).toBeGreaterThan(0.7);
    expect(aiWinRate("extreme", alwaysRock)).toBeGreaterThan(0.9);
  });

  it("hard and extreme see through a repeating cycle that medium cannot", () => {
    expect(aiWinRate("medium", cyclePlayer)).toBeLessThan(0.45);
    expect(aiWinRate("hard", cyclePlayer)).toBeGreaterThan(0.75);
    expect(aiWinRate("extreme", cyclePlayer)).toBeGreaterThan(0.85);
  });
});
