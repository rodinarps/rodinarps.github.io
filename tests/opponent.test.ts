import { describe, expect, it } from "vitest";
import { chooseOpponentMove, mostFrequentChoice, pickRandomChoice } from "../src/core/opponent";

describe("pickRandomChoice", () => {
  it("maps the random source onto the three choices", () => {
    expect(pickRandomChoice(() => 0)).toBe("rock");
    expect(pickRandomChoice(() => 0.4)).toBe("paper");
    expect(pickRandomChoice(() => 0.99)).toBe("scissors");
  });
});

describe("mostFrequentChoice", () => {
  it("returns the most played choice", () => {
    expect(mostFrequentChoice(["paper", "rock", "paper"])).toBe("paper");
  });

  it("breaks ties in rock, paper, scissors order", () => {
    expect(mostFrequentChoice(["scissors", "paper"])).toBe("paper");
    expect(mostFrequentChoice(["scissors", "rock"])).toBe("rock");
  });
});

describe("chooseOpponentMove", () => {
  it("plays randomly until it has seen enough moves", () => {
    expect(chooseOpponentMove(["paper", "paper"], () => 0)).toBe("rock");
  });

  it("counters the player's favourite move when not in a random turn", () => {
    // random() = 0.9 is above the 30% randomness threshold.
    expect(chooseOpponentMove(["paper", "paper", "paper"], () => 0.9)).toBe("scissors");
  });

  it("sometimes ignores the history and plays randomly", () => {
    // random() = 0.1 is below the 30% threshold, so the pick is random (here: rock).
    expect(chooseOpponentMove(["paper", "paper", "paper"], () => 0.1)).toBe("rock");
  });
});
