import { describe, expect, it } from "vitest";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, DIFFICULTY_PROFILES, isDifficulty } from "../src/core/difficulty";
import { chooseAiMove, pickRandomChoice } from "../src/core/opponent";
import { decodeRounds } from "../src/core/record";

/** The player's moves as letters ("rrp" = rock, rock, paper). What the AI played is irrelevant here. */
const playerMoves = (letters: string) => decodeRounds([...letters].map((letter) => `${letter}r`).join(""));

/** A random source that returns the given numbers in turn. */
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length] as number;
};

describe("pickRandomChoice", () => {
  it("maps the random source onto the three choices", () => {
    expect(pickRandomChoice(() => 0)).toBe("rock");
    expect(pickRandomChoice(() => 0.4)).toBe("paper");
    expect(pickRandomChoice(() => 0.99)).toBe("scissors");
  });
});

describe("difficulty levels", () => {
  it("has four levels, getting less random as they get harder", () => {
    expect(DIFFICULTIES).toEqual(["easy", "medium", "hard", "extreme"]);
    const randomness = DIFFICULTIES.map((level) => DIFFICULTY_PROFILES[level].randomness);
    expect(randomness).toEqual([...randomness].sort((first, second) => second - first));
  });

  it("keeps the original algorithm as medium", () => {
    expect(DEFAULT_DIFFICULTY).toBe("medium");
    expect(DIFFICULTY_PROFILES.medium).toEqual({
      randomness: 0.3,
      generosity: 0,
      warmupRounds: 3,
      predictors: ["frequency"],
    });
  });

  it("recognises level names", () => {
    expect(isDifficulty("hard")).toBe(true);
    expect(isDifficulty("nightmare")).toBe(false);
  });
});

describe("chooseAiMove", () => {
  it("plays randomly until it has seen enough rounds", () => {
    expect(chooseAiMove(playerMoves("rr"), "medium", () => 0)).toBe("rock");
    // easy waits for 5 rounds: with 4 rocks it must not yet play the counter (paper)
    expect(chooseAiMove(playerMoves("rrrr"), "easy", () => 0.99)).toBe("scissors");
  });

  it("medium counters the player's favourite move when not in a random turn", () => {
    expect(chooseAiMove(playerMoves("ppp"), "medium", () => 0.9)).toBe("scissors");
  });

  it("medium sometimes ignores the history and plays randomly", () => {
    expect(chooseAiMove(playerMoves("ppp"), "medium", () => 0.1)).toBe("rock");
  });

  it("easy sometimes deliberately plays a move that loses to its guess", () => {
    // first number: not random (0.9 >= 0.7); second: below the 0.5 generosity, so it gives the round away
    expect(chooseAiMove(playerMoves("rrrrr"), "easy", sequence(0.9, 0.1))).toBe("scissors");
    // second number above the generosity: it plays the counter (paper)
    expect(chooseAiMove(playerMoves("rrrrr"), "easy", sequence(0.9, 0.9))).toBe("paper");
  });

  it("extreme spots a repeating cycle that medium cannot", () => {
    // rock, paper, scissors, rock, paper, scissors, rock, paper: next is scissors, so the AI plays rock
    const cycle = playerMoves("rpsrpsrp");
    expect(chooseAiMove(cycle, "extreme", () => 0.99)).toBe("rock");
    expect(chooseAiMove(cycle, "hard", () => 0.99)).toBe("rock");
    // medium only sees "everyone played about the same", and counters rock (its first favourite)
    expect(chooseAiMove(cycle, "medium", () => 0.99)).toBe("paper");
  });
});
