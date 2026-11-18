import { CHOICES } from "./constants";
import type { Choice, RoundResult } from "./types";

const BEATS: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

/** The choice that beats the given one. */
const COUNTER: Record<Choice, Choice> = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

export function isChoice(value: unknown): value is Choice {
  return CHOICES.includes(value as Choice);
}

export function counterTo(choice: Choice): Choice {
  return COUNTER[choice];
}

export function determineRoundResult(player: Choice, cpu: Choice): RoundResult {
  if (player === cpu) return "tie";
  return BEATS[player] === cpu ? "win" : "lose";
}
