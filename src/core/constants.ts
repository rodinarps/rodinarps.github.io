import type { Choice, CountedMode, Mode } from "./types";

export const CHOICES: readonly Choice[] = ["rock", "paper", "scissors"];
export const MODES: readonly Mode[] = ["time", "rounds", "free"];

export interface ModeConfig {
  readonly presets: readonly number[];
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
}

/** Limits and quick choices for the modes that take a number. Free play has none. */
export const MODE_CONFIG: Record<CountedMode, ModeConfig> = {
  time: { presets: [5, 10, 15, 30, 60], defaultValue: 10, min: 1, max: 60 },
  rounds: { presets: [10, 30, 60, 90], defaultValue: 10, min: 1, max: 100 },
};

export const SECONDS_PER_MINUTE = 60;

// UI timing
export const CLOCK_TICK_MS = 1_000;
export const RESULT_DISPLAY_DURATION_MS = 5_000;
export const TOAST_DURATION_MS = 3_000;
export const LOW_TIME_THRESHOLD_SECONDS = 30;

// History
/** Backup files bigger than this are refused before they are even read. */
export const MAX_IMPORT_BYTES = 5_000_000;
