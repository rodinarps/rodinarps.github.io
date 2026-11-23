export type Choice = "rock" | "paper" | "scissors";
/** time: a clock. rounds: a fixed number of rounds. free: no limit, you decide when to stop. */
export type Mode = "time" | "rounds" | "free";
/** The modes that have a setting (minutes or a number of rounds). */
export type CountedMode = Exclude<Mode, "free">;
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
  /** Minutes (time mode), number of rounds (rounds mode), or 0 (free play has no setting). */
  readonly setting: number;
  readonly difficulty: Difficulty;
  readonly playerScore: number;
  readonly aiScore: number;
  /** Two letters per round: the player's move, then the AI's (r = rock, p = paper, s = scissors). */
  readonly rounds: string;
}
