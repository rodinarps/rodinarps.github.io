import { CHOICES } from "./constants";
import { decodeRounds } from "./record";
import { determineRoundResult, verdictFromScores } from "./rules";
import type { Choice, MatchRecord } from "./types";

export interface MoveStats {
  readonly played: number;
  readonly won: number;
}

export interface HistoryStats {
  readonly matches: number;
  readonly matchWins: number;
  readonly matchLosses: number;
  readonly matchTies: number;
  readonly rounds: number;
  readonly roundWins: number;
  readonly roundLosses: number;
  readonly roundTies: number;
  /** How often the player used each move, and how often it won. */
  readonly moves: Record<Choice, MoveStats>;
  /** The player's most played move (ties go to rock, paper, scissors in that order). */
  readonly favoriteMove: Choice | null;
}

export function computeStats(records: readonly MatchRecord[]): HistoryStats {
  let matchWins = 0;
  let matchLosses = 0;
  let matchTies = 0;
  let roundWins = 0;
  let roundLosses = 0;
  let roundTies = 0;
  const played: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
  const won: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };

  for (const record of records) {
    const verdict = verdictFromScores(record.playerScore, record.aiScore);
    if (verdict === "win") matchWins += 1;
    else if (verdict === "lose") matchLosses += 1;
    else matchTies += 1;

    for (const { playerChoice, aiChoice } of decodeRounds(record.rounds)) {
      played[playerChoice] += 1;
      const result = determineRoundResult(playerChoice, aiChoice);
      if (result === "win") {
        roundWins += 1;
        won[playerChoice] += 1;
      } else if (result === "lose") roundLosses += 1;
      else roundTies += 1;
    }
  }

  const rounds = roundWins + roundLosses + roundTies;
  const favoriteMove =
    rounds === 0 ? null : CHOICES.reduce((best, choice) => (played[choice] > played[best] ? choice : best));

  return {
    matches: records.length,
    matchWins,
    matchLosses,
    matchTies,
    rounds,
    roundWins,
    roundLosses,
    roundTies,
    moves: {
      rock: { played: played.rock, won: won.rock },
      paper: { played: played.paper, won: won.paper },
      scissors: { played: played.scissors, won: won.scissors },
    },
    favoriteMove,
  };
}
