export type Choice = "rock" | "paper" | "scissors";
export type Mode = "time" | "rounds";
export type Difficulty = "easy" | "medium" | "hard" | "extreme";
export type RoundResult = "win" | "tie" | "lose";
export type MatchStatus = "playing" | "paused" | "finished";

/** What each side played in one round. */
export interface RoundPair {
  readonly playerChoice: Choice;
  readonly aiChoice: Choice;
}

export interface RoundOutcome extends RoundPair {
  readonly result: RoundResult;
}

/** One finished match, as saved in the browser. Bump `version` if the shape ever changes. */
export interface MatchRecord {
  readonly version: 2;
  /** Unique id, used to skip duplicates when importing a backup. */
  readonly id: string;
  /** When the match started (ISO 8601). */
  readonly startedAt: string;
  readonly mode: Mode;
  /** Minutes (time mode) or number of rounds (rounds mode). */
  readonly setting: number;
  readonly difficulty: Difficulty;
  readonly playerScore: number;
  readonly aiScore: number;
  /** Two letters per round: the player's move, then the AI's (r = rock, p = paper, s = scissors). */
  readonly rounds: string;
}
