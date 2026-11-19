import type { RoundOutcome, RoundResult } from "../core/types";
import { capitalize } from "./format";
import type { ImportSummary } from "../storage/historyStore";
import type { IconName } from "./icons";

export type Tone = "neutral" | RoundResult;

export interface Banner {
  readonly message: string;
  readonly tone: Tone;
  readonly icon?: IconName;
}

export const MESSAGES = {
  welcome: "Welcome! Choose a game mode to get started.",
  chooseMove: "Choose your move!",
  paused: "Game paused. Take your time.",
  restarted: "Game restarted. Good luck!",
  quit: "To quit the game, close this browser tab.",
  confirmRestart: "Restart with the same settings?",
  confirmHome: "Go back to the main menu? Your current match will be lost.",
  historyNotSaved: "Couldn't save this match: the browser is blocking or has filled its site storage.",
  nothingToExport: "There is no history to export yet.",
  backupDownloaded: "Backup downloaded. Keep the file somewhere safe.",
  fileTooLarge: "That file is too large to be a history backup.",
  importFailed: "Couldn't read that file.",
  confirmClearHistory: "Delete all saved matches from this browser? This can't be undone, so export a backup first if you want to keep them.",
  historyCleared: "History cleared.",
  historyNotCleared: "Couldn't clear the history.",
} as const;

export const HISTORY_TEXT = {
  banner: "Your match history. It is saved in this browser only.",
  empty: "No matches saved yet. Finish a match and it will show up here.",
  noteAvailable: "Saved only in this browser on this device. Export a backup before clearing browser data.",
  noteUnavailable: "This browser is blocking site storage, so matches can't be saved here.",
  latest: (shown: number, total: number) => `Showing the latest ${shown} of ${total} matches.`,
} as const;

export function importMessage({ added, duplicates, invalid }: ImportSummary): string {
  const parts = [`Imported ${added} ${added === 1 ? "match" : "matches"}`];
  if (duplicates > 0) parts.push(`${duplicates} already saved`);
  if (invalid > 0) parts.push(`${invalid} skipped as damaged`);
  return `${parts.join(" · ")}.`;
}

export function roundBanner({ playerChoice, cpuChoice, result }: RoundOutcome): Banner {
  const player = capitalize(playerChoice);
  const cpu = capitalize(cpuChoice);

  switch (result) {
    case "win":
      return { message: `You Win!  ${player} beats ${cpu}`, tone: "win", icon: "party" };
    case "lose":
      return { message: `You Lose!  ${cpu} beats ${player}`, tone: "lose", icon: "skull" };
    case "tie":
      return { message: `Tie!  Both chose ${player}`, tone: "tie", icon: "handshake" };
  }
}

export function finalBanner(playerScore: number, cpuScore: number): Banner {
  const score = `${playerScore} — ${cpuScore}`;

  if (playerScore === 0 && cpuScore === 0) {
    return { message: "Game Over! No scores recorded.", tone: "tie" };
  }
  if (playerScore > cpuScore) return { message: `You Win!  ${score}`, tone: "win", icon: "trophy" };
  if (cpuScore > playerScore) return { message: `CPU Wins!  ${score}`, tone: "lose" };
  return { message: `It's a Tie!  ${score}`, tone: "tie" };
}
