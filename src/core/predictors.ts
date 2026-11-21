import { CHOICES } from "./constants";
import type { PredictorName } from "./difficulty";
import { determineRoundResult } from "./rules";
import type { Choice, RoundPair } from "./types";

/** Guesses the player's NEXT move from the rounds already played, or `null` if it can't tell yet. */
export type Predictor = (rounds: readonly RoundPair[]) => Choice | null;

/** "Recent" means the last this-many rounds. */
const RECENT_WINDOW = 6;
/** A predictor is judged on how it would have done over the last this-many rounds. */
const JUDGE_WINDOW = 8;

function emptyCounts(): Record<Choice, number> {
  return { rock: 0, paper: 0, scissors: 0 };
}

/** The most common choice. Ties go to rock, paper, scissors in that order. `null` if nothing was counted. */
function mostCommon(counts: Record<Choice, number>): Choice | null {
  const best = CHOICES.reduce((leader, choice) => (counts[choice] > counts[leader] ? choice : leader));
  return counts[best] === 0 ? null : best;
}

function countPlayerMoves(rounds: readonly RoundPair[]): Record<Choice, number> {
  const counts = emptyCounts();
  for (const { playerChoice } of rounds) counts[playerChoice] += 1;
  return counts;
}

const frequency: Predictor = (rounds) => mostCommon(countPlayerMoves(rounds));

const recentFrequency: Predictor = (rounds) => mostCommon(countPlayerMoves(rounds.slice(-RECENT_WINDOW)));

/** Looks for earlier times the player's last `order` moves came up, and what they played next. */
function markov(order: number): Predictor {
  return (rounds) => {
    if (rounds.length <= order) return null;
    const moves = rounds.map(({ playerChoice }) => playerChoice);
    const context = moves.slice(-order);
    const nextCounts = emptyCounts();

    for (let next = order; next < moves.length; next += 1) {
      const matches = context.every((move, offset) => moves[next - order + offset] === move);
      if (matches) nextCounts[moves[next] as Choice] += 1;
    }
    return mostCommon(nextCounts);
  };
}

/** How far a move is from another in the rock -> paper -> scissors -> rock cycle (0, 1 or 2 steps). */
function stepsBetween(from: Choice, to: Choice): number {
  return (CHOICES.indexOf(to) - CHOICES.indexOf(from) + CHOICES.length) % CHOICES.length;
}

function stepFrom(from: Choice, steps: number): Choice {
  return CHOICES[(CHOICES.indexOf(from) + steps) % CHOICES.length] as Choice;
}

/**
 * Learns how the player changes their move after winning, losing or tying
 * (stay, or move one or two steps round the cycle), and applies that to the last round.
 */
const reaction: Predictor = (rounds) => {
  const last = rounds.at(-1);
  if (!last || rounds.length < 3) return null;

  const lastResult = determineRoundResult(last.playerChoice, last.aiChoice);
  const stepCounts = [0, 0, 0];
  for (let index = 0; index < rounds.length - 1; index += 1) {
    const round = rounds[index] as RoundPair;
    const following = rounds[index + 1] as RoundPair;
    if (determineRoundResult(round.playerChoice, round.aiChoice) === lastResult) {
      stepCounts[stepsBetween(round.playerChoice, following.playerChoice)] += 1;
    }
  }

  const seen = stepCounts[0] + stepCounts[1] + stepCounts[2];
  if (seen === 0) return null;
  const likeliestSteps = stepCounts.indexOf(Math.max(...stepCounts));
  return stepFrom(last.playerChoice, likeliestSteps);
};

const PREDICTORS: Record<PredictorName, Predictor> = {
  frequency,
  recentFrequency,
  markov1: markov(1),
  markov2: markov(2),
  reaction,
};

/** How often a predictor would have been right over the last few rounds (nudged toward 1 in 3 for short records). */
function trackRecord(predictor: Predictor, rounds: readonly RoundPair[]): number {
  let hits = 0;
  let tried = 0;
  for (let round = Math.max(1, rounds.length - JUDGE_WINDOW); round < rounds.length; round += 1) {
    const guess = predictor(rounds.slice(0, round));
    if (guess === null) continue;
    tried += 1;
    if (guess === (rounds[round] as RoundPair).playerChoice) hits += 1;
  }
  return (hits + 1) / (tried + 3);
}

/**
 * The player's likely next move. With one predictor it simply uses it; with several it
 * follows whichever has been right most often lately (earlier in the list wins ties).
 */
export function predictNextMove(rounds: readonly RoundPair[], names: readonly PredictorName[]): Choice | null {
  let best: { guess: Choice; score: number } | null = null;

  for (const name of names) {
    const predictor = PREDICTORS[name];
    const guess = predictor(rounds);
    if (guess === null) continue;
    if (names.length === 1) return guess;

    const score = trackRecord(predictor, rounds);
    if (best === null || score > best.score) best = { guess, score };
  }
  return best?.guess ?? null;
}
