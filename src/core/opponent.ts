import { AI_MIN_HISTORY, AI_RANDOMNESS, CHOICES } from "./constants";
import { counterTo } from "./rules";
import type { Choice } from "./types";

/** Returns a number in [0, 1). Injectable so tests can be deterministic. */
export type RandomSource = () => number;

export function pickRandomChoice(random: RandomSource = Math.random): Choice {
  return CHOICES[Math.floor(random() * CHOICES.length)] as Choice;
}

/** The player's most frequent choice. Ties go to the first of rock, paper, scissors. */
export function mostFrequentChoice(history: readonly Choice[]): Choice {
  const counts: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
  for (const choice of history) counts[choice] += 1;

  return CHOICES.reduce((best, choice) => (counts[choice] > counts[best] ? choice : best));
}

/**
 * Picks the computer's move: random at first (and 30% of the time afterwards),
 * otherwise the counter to whatever the player has played most often.
 */
export function chooseOpponentMove(
  playerHistory: readonly Choice[],
  random: RandomSource = Math.random,
): Choice {
  const hasEnoughHistory = playerHistory.length >= AI_MIN_HISTORY;
  if (!hasEnoughHistory || random() < AI_RANDOMNESS) return pickRandomChoice(random);
  return counterTo(mostFrequentChoice(playerHistory));
}
