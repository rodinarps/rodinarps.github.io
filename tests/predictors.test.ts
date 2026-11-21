import { describe, expect, it } from "vitest";
import { predictNextMove } from "../src/core/predictors";
import { decodeRounds } from "../src/core/record";

/** The player's moves as letters ("rrp" = rock, rock, paper). What the AI played is irrelevant here. */
const playerMoves = (letters: string) => decodeRounds([...letters].map((letter) => `${letter}r`).join(""));

describe("frequency", () => {
  it("guesses the player's most played move", () => {
    expect(predictNextMove(playerMoves("rrp"), ["frequency"])).toBe("rock");
  });

  it("has no guess without history", () => {
    expect(predictNextMove([], ["frequency"])).toBeNull();
  });

  it("breaks ties in rock, paper, scissors order", () => {
    expect(predictNextMove(playerMoves("sp"), ["frequency"])).toBe("paper");
  });
});

describe("recentFrequency", () => {
  it("looks only at the last few rounds", () => {
    const moves = playerMoves("rrrrrrrpppp"); // 7 rocks, then 4 papers
    expect(predictNextMove(moves, ["frequency"])).toBe("rock");
    expect(predictNextMove(moves, ["recentFrequency"])).toBe("paper");
  });
});

describe("markov", () => {
  it("learns what the player usually plays after their last move", () => {
    expect(predictNextMove(playerMoves("rpsrpsrp"), ["markov1"])).toBe("scissors");
  });

  it("uses the last two moves when asked to", () => {
    // after "rr" the player has always played paper
    expect(predictNextMove(playerMoves("rrprrprr"), ["markov2"])).toBe("paper");
  });

  it("has no guess for a pattern it has never seen", () => {
    expect(predictNextMove(playerMoves("rp"), ["markov1"])).toBeNull();
    expect(predictNextMove(playerMoves("r"), ["markov2"])).toBeNull();
  });
});

describe("reaction", () => {
  it("learns how the player changes their move after a loss", () => {
    // each time the player lost, they moved one step on (rock -> paper -> scissors -> rock)
    const rounds = decodeRounds("rp" + "ps" + "sr" + "rp");
    expect(predictNextMove(rounds, ["reaction"])).toBe("paper");
  });

  it("needs a few rounds before guessing", () => {
    expect(predictNextMove(decodeRounds("rp"), ["reaction"])).toBeNull();
  });
});

describe("several predictors", () => {
  it("follows the one that has been right more often lately", () => {
    const cycle = playerMoves("rpsrpsrpsrpsr"); // 5 rocks, 4 papers, 4 scissors: frequency says rock, the cycle says paper
    expect(predictNextMove(cycle, ["frequency"])).toBe("rock");
    expect(predictNextMove(cycle, ["frequency", "markov1"])).toBe("paper");
  });

  it("has no guess when none of them can tell", () => {
    expect(predictNextMove([], ["frequency", "markov1", "markov2", "reaction"])).toBeNull();
  });
});
