import type { RoundOutcome, RoundResult } from "../core/types";
import { t, type MessageKey } from "../i18n";
import { HistoryImportError, type HistoryImportErrorCode, type ImportSummary } from "../storage/historyStore";
import type { IconName } from "./icons";

export type Tone = "neutral" | RoundResult;

export interface Banner {
  readonly message: string;
  readonly tone: Tone;
  readonly icon?: IconName;
}

/**
 * What the banner is saying, kept as data (not as finished text) so it can be
 * written again in the other language when the player switches.
 */
export type BannerState =
  | { readonly kind: "welcome" }
  | { readonly kind: "chooseMove" }
  | { readonly kind: "paused" }
  | { readonly kind: "history" }
  | { readonly kind: "round"; readonly outcome: RoundOutcome }
  | { readonly kind: "final"; readonly playerScore: number; readonly aiScore: number };

export function roundBanner({ playerChoice, aiChoice, result }: RoundOutcome): Banner {
  switch (result) {
    case "win":
      return {
        message: t("msg.roundWin", {
          winner: t(`choice.${playerChoice}`),
          beats: t(`beats.${playerChoice}`),
          loser: t(`choice.${aiChoice}`),
        }),
        tone: "win",
        icon: "party",
      };
    case "lose":
      return {
        message: t("msg.roundLose", {
          winner: t(`choice.${aiChoice}`),
          beats: t(`beats.${aiChoice}`),
          loser: t(`choice.${playerChoice}`),
        }),
        tone: "lose",
        icon: "skull",
      };
    case "tie":
      return { message: t("msg.roundTie", { move: t(`choice.${playerChoice}`) }), tone: "tie", icon: "handshake" };
  }
}

export function finalBanner(playerScore: number, aiScore: number): Banner {
  const score = `${playerScore} — ${aiScore}`;

  if (playerScore === 0 && aiScore === 0) return { message: t("msg.finalNone"), tone: "tie" };
  if (playerScore > aiScore) return { message: t("msg.finalWin", { score }), tone: "win", icon: "trophy" };
  if (aiScore > playerScore) return { message: t("msg.finalLose", { score }), tone: "lose" };
  return { message: t("msg.finalTie", { score }), tone: "tie" };
}

export function buildBanner(state: BannerState): Banner {
  switch (state.kind) {
    case "welcome":
      return { message: t("msg.welcome"), tone: "neutral" };
    case "chooseMove":
      return { message: t("msg.chooseMove"), tone: "neutral" };
    case "paused":
      return { message: t("msg.paused"), tone: "neutral" };
    case "history":
      return { message: t("history.banner"), tone: "neutral" };
    case "round":
      return roundBanner(state.outcome);
    case "final":
      return finalBanner(state.playerScore, state.aiScore);
  }
}

export function importMessage({ added, duplicates, invalid }: ImportSummary): string {
  const parts = [t("import.done", { added })];
  if (duplicates > 0) parts.push(t("import.duplicates", { count: duplicates }));
  if (invalid > 0) parts.push(t("import.invalid", { count: invalid }));
  return `${parts.join(" · ")}.`;
}

const IMPORT_ERROR_TEXT: Record<HistoryImportErrorCode, MessageKey> = {
  "invalid-file": "import.invalidFile",
  "unsupported-version": "import.unsupportedVersion",
  "save-failed": "import.saveFailed",
};

export function importErrorMessage(error: unknown): string {
  return error instanceof HistoryImportError ? t(IMPORT_ERROR_TEXT[error.code]) : t("msg.importFailed");
}
