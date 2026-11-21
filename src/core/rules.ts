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

/** The choice that loses to the given one. */
export function yieldTo(choice: Choice): Choice {
  return BEATS[choice];
}

export function isChoice(value: unknown): value is Choice {
  return CHOICES.includes(value as Choice);
}

export function counterTo(choice: Choice): Choice {
  return COUNTER[choice];
}

/** Who is ahead, from the player's point of view. */
export function verdictFromScores(player: number, ai: number): RoundResult {
  if (player > ai) return "win";
  if (player < ai) return "lose";
  return "tie";
}

export function determineRoundResult(player: Choice, ai: Choice): RoundResult {
  if (player === ai) return "tie";
  return BEATS[player] === ai ? "win" : "lose";
}
