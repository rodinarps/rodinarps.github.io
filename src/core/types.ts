export type Choice = "rock" | "paper" | "scissors";
export type Mode = "time" | "rounds";
export type RoundResult = "win" | "tie" | "lose";
export type MatchStatus = "playing" | "paused" | "finished";

/** One finished match, as saved in the browser. Bump `version` if the shape ever changes. */
export interface MatchRecord {
  readonly version: 1;
  /** Unique id, used to skip duplicates when importing a backup. */
  readonly id: string;
  /** When the match started (ISO 8601). */
  readonly startedAt: string;
  readonly mode: Mode;
  /** Minutes (time mode) or number of rounds (rounds mode). */
  readonly setting: number;
  readonly playerScore: number;
  readonly cpuScore: number;
  /** Two letters per round: the player's move, then the computer's (r = rock, p = paper, s = scissors). */
  readonly rounds: string;
}

export interface RoundOutcome {
  readonly playerChoice: Choice;
  readonly cpuChoice: Choice;
  readonly result: RoundResult;
}
