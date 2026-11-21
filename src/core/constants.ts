import type { Choice, Mode } from "./types";

export const CHOICES: readonly Choice[] = ["rock", "paper", "scissors"];

export interface ModeConfig {
  readonly presets: readonly number[];
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
}

export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  time: { presets: [5, 10, 15, 30, 60], defaultValue: 10, min: 1, max: 60 },
  rounds: { presets: [10, 20, 30, 50], defaultValue: 10, min: 1, max: 50 },
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
