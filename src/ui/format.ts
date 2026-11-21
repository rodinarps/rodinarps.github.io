import type { Mode } from "../core/types";
import { t } from "../i18n";

/** 605 seconds -> "10m 05s" (English) or "10:05" (Arabic) */
export function formatTimeLeft(totalSeconds: number): string {
  return t("progress.timeValue", {
    m: Math.floor(totalSeconds / 60),
    s: String(totalSeconds % 60).padStart(2, "0"),
  });
}

/** 3, 8 -> "38%". Shows a dash when there is nothing to divide by. */
export function formatPercent(part: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

/** "18 Nov 2026 · 14:05" in the visitor's own time zone. Spelled out here so it never depends on system locale fonts. */
export function formatMatchDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = t("date.months").split(",");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} · ${hours}:${minutes}`;
}

/** "Time · 10 min" or "Rounds · 20" */
export function describeMatchSetup(mode: Mode, setting: number): string {
  return t(mode === "time" ? "history.setupTime" : "history.setupRounds", { n: setting });
}

/** "rodinarps-history-2026-11-18.json" */
export function formatBackupFileName(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `rodinarps-history-${date.getFullYear()}-${month}-${day}.json`;
}
