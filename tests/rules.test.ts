import { describe, expect, it } from "vitest";
import { CHOICES } from "../src/core/constants";
import { counterTo, determineRoundResult, isChoice } from "../src/core/rules";

describe("determineRoundResult", () => {
  it("ties when both pick the same", () => {
    for (const choice of CHOICES) expect(determineRoundResult(choice, choice)).toBe("tie");
  });

  it.each([
    ["rock", "scissors"],
    ["paper", "rock"],
    ["scissors", "paper"],
  ] as const)("%s beats %s", (winner, loser) => {
    expect(determineRoundResult(winner, loser)).toBe("win");
    expect(determineRoundResult(loser, winner)).toBe("lose");
  });
});

describe("counterTo", () => {
  it("always returns the choice that beats the input", () => {
    for (const choice of CHOICES) {
      expect(determineRoundResult(counterTo(choice), choice)).toBe("win");
    }
  });
});

describe("isChoice", () => {
  it("accepts only the three valid choices", () => {
    expect(isChoice("rock")).toBe(true);
    expect(isChoice("lizard")).toBe(false);
    expect(isChoice(undefined)).toBe(false);
  });
});
