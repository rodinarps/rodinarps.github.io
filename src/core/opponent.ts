import { CHOICES } from "./constants";
import { DEFAULT_DIFFICULTY, DIFFICULTY_PROFILES } from "./difficulty";
import { predictNextMove } from "./predictors";
import { counterTo, yieldTo } from "./rules";
import type { Choice, Difficulty, RoundPair } from "./types";

/** Returns a number in [0, 1). Injectable so tests can be deterministic. */
export type RandomSource = () => number;

export function pickRandomChoice(random: RandomSource = Math.random): Choice {
  return CHOICES[Math.floor(random() * CHOICES.length)] as Choice;
}

/**
 * Picks the AI's move from the rounds already played (never from the player's current move).
 * It guesses what the player will do next and plays the move that beats that guess,
 * except for a share of rounds (set by the difficulty) where it just plays at random,
 * and, on the easiest level, sometimes deliberately plays a move that loses to its guess.
 */
export function chooseAiMove(
  rounds: readonly RoundPair[],
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
  random: RandomSource = Math.random,
): Choice {
  const { randomness, generosity, warmupRounds, predictors } = DIFFICULTY_PROFILES[difficulty];
  if (rounds.length < warmupRounds || random() < randomness) return pickRandomChoice(random);

  const predicted = predictNextMove(rounds, predictors);
  if (!predicted) return pickRandomChoice(random);

  const goesEasyOnYou = generosity > 0 && random() < generosity;
  return goesEasyOnYou ? yieldTo(predicted) : counterTo(predicted);
}
