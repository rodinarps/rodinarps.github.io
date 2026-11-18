export type Choice = "rock" | "paper" | "scissors";
export type Mode = "time" | "rounds";
export type RoundResult = "win" | "tie" | "lose";
export type MatchStatus = "playing" | "paused" | "finished";

export interface RoundOutcome {
  readonly playerChoice: Choice;
  readonly cpuChoice: Choice;
  readonly result: RoundResult;
}
