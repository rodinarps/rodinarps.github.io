import { SECONDS_PER_MINUTE } from "./constants";
import { chooseOpponentMove, type RandomSource } from "./opponent";
import { determineRoundResult, verdictFromScores } from "./rules";
import type { Choice, MatchStatus, Mode, RoundOutcome, RoundResult } from "./types";

/**
 * One game session: scores, the player's move history and the remaining
 * time or rounds. Contains no DOM or timers, so it is easy to unit test.
 *
 * - "time" mode: `setting` is minutes; call `tick()` once per second.
 * - "rounds" mode: `setting` is the number of rounds.
 */
export class Match {
  readonly total: number;

  private currentStatus: MatchStatus = "playing";
  private player = 0;
  private cpu = 0;
  private left: number;
  private readonly outcomes: RoundOutcome[] = [];

  constructor(
    readonly mode: Mode,
    /** Minutes (time mode) or number of rounds (rounds mode). */
    readonly setting: number,
    readonly startedAt: Date = new Date(),
  ) {
    if (!Number.isInteger(setting) || setting < 1) {
      throw new RangeError(`Match setting must be a positive integer, got ${setting}`);
    }
    this.total = mode === "time" ? setting * SECONDS_PER_MINUTE : setting;
    this.left = this.total;
  }

  get status(): MatchStatus {
    return this.currentStatus;
  }

  get playerScore(): number {
    return this.player;
  }

  get cpuScore(): number {
    return this.cpu;
  }

  /** Seconds left (time mode) or rounds left (rounds mode). */
  get remaining(): number {
    return this.left;
  }

  /** 0–100: how much of the match has been used up. */
  get progressPercent(): number {
    return ((this.total - this.left) / this.total) * 100;
  }

  /** Every round played so far, in order. */
  get rounds(): readonly RoundOutcome[] {
    return this.outcomes;
  }

  /** Who is ahead right now, from the player's point of view. */
  get verdict(): RoundResult {
    return verdictFromScores(this.player, this.cpu);
  }

  /** Plays one round. Returns `null` when the match is paused or finished. */
  playRound(playerChoice: Choice, random: RandomSource = Math.random): RoundOutcome | null {
    if (this.currentStatus !== "playing") return null;

    const playerHistory = this.outcomes.map((outcome) => outcome.playerChoice);
    const cpuChoice = chooseOpponentMove(playerHistory, random);
    const result = determineRoundResult(playerChoice, cpuChoice);
    const outcome: RoundOutcome = { playerChoice, cpuChoice, result };
    this.outcomes.push(outcome);

    if (result === "win") this.player += 1;
    if (result === "lose") this.cpu += 1;

    if (this.mode === "rounds") this.consumeOne();

    return outcome;
  }

  /** Advances the clock by one second. Only counts in time mode while playing. */
  tick(): void {
    if (this.mode === "time" && this.currentStatus === "playing") this.consumeOne();
  }

  /** Pauses or resumes a time-mode match. No-op otherwise. */
  togglePause(): void {
    if (this.mode !== "time") return;
    if (this.currentStatus === "playing") this.currentStatus = "paused";
    else if (this.currentStatus === "paused") this.currentStatus = "playing";
  }

  private consumeOne(): void {
    this.left = Math.max(0, this.left - 1);
    if (this.left === 0) this.currentStatus = "finished";
  }
}
