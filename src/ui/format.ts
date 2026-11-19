import type { Mode } from "../core/types";

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** 605 -> "10m 05s" */
export function formatTimeLeft(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/** 3, 8 -> "38%". Shows a dash when there is nothing to divide by. */
export function formatPercent(part: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "18 Nov 2026 · 14:05" in the visitor's own time zone. Spelled out here so it never depends on system locale fonts. */
export function formatMatchDate(isoDate: string): string {
  const date = new Date(isoDate);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} · ${hours}:${minutes}`;
}

/** "Time · 10 min" or "Rounds · 20" */
export function describeMatchSetup(mode: Mode, setting: number): string {
  return mode === "time" ? `Time · ${setting} min` : `Rounds · ${setting}`;
}

/** "rodinarps-history-2026-11-18.json" */
export function formatBackupFileName(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `rodinarps-history-${date.getFullYear()}-${month}-${day}.json`;
}
