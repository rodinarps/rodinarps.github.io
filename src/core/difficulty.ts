import type { Difficulty } from "./types";

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard", "extreme"];
export const DEFAULT_DIFFICULTY: Difficulty = "medium";

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}

/**
 * Ways the AI can guess your next move (see predictors.ts):
 * - frequency: your most played move overall
 * - recentFrequency: your most played move in the last few rounds
 * - markov1 / markov2: what you usually play after your last one / last two moves
 * - reaction: how you change your move after winning, losing or tying
 */
export type PredictorName = "frequency" | "recentFrequency" | "markov1" | "markov2" | "reaction";

export interface DifficultyProfile {
  /** Share of rounds (0 to 1) where the AI ignores what it has learned and plays at random. */
  readonly randomness: number;
  /** Share of the remaining rounds where the AI deliberately plays a move that LOSES to its guess. */
  readonly generosity: number;
  /** The AI plays at random until it has seen this many rounds. */
  readonly warmupRounds: number;
  /** What the AI may learn from. With several, it follows whichever has been right most often lately. */
  readonly predictors: readonly PredictorName[];
}

/**
 * The AI never sees your current move: it only learns from rounds that are already over.
 * A harder level is simply a better learner, so nobody can beat a player who is truly random.
 */
export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: { randomness: 0.7, generosity: 0.5, warmupRounds: 5, predictors: ["frequency"] },
  // The original algorithm, so matches saved before difficulty levels existed count as medium.
  medium: { randomness: 0.3, generosity: 0, warmupRounds: 3, predictors: ["frequency"] },
  hard: { randomness: 0.15, generosity: 0, warmupRounds: 3, predictors: ["recentFrequency", "markov1"] },
  extreme: {
    randomness: 0.05,
    generosity: 0,
    warmupRounds: 2,
    predictors: ["frequency", "recentFrequency", "markov1", "markov2", "reaction"],
  },
};
