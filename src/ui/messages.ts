import type { RoundOutcome, RoundResult } from "../core/types";
import { capitalize } from "./format";
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
} as const;

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
