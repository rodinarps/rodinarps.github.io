import { LOW_TIME_THRESHOLD_SECONDS, TOAST_DURATION_MS } from "../core/constants";
import type { Match } from "../core/match";
import { isChoice } from "../core/rules";
import type { Choice, Difficulty, Mode } from "../core/types";
import { t } from "../i18n";
import { DelayedAction } from "../utils/timers";
import { make, requireElement, requireElements } from "./dom";
import { formatTimeLeft } from "./format";
import { createIcon, type IconName } from "./icons";
import type { Banner } from "./messages";

const COLOR = {
  win: "var(--win)",
  lose: "var(--lose)",
  tie: "var(--tie)",
  muted: "var(--muted)",
  accent: "var(--orange-light)",
  calm: "var(--purple)",
} as const;

type Screen = "home" | "game" | "history";

const MODE_BUTTON_SELECTOR: Record<Mode, string> = {
  time: "#choose-time",
  rounds: "#choose-rounds",
  free: "#choose-free",
};

export interface ViewHandlers {
  onModeSelected(mode: Mode): void;
  onChoice(choice: Choice): void;
  onTogglePause(): void;
  onFinish(): void;
  onRestart(): void;
  onHome(): void;
  onQuit(): void;
  onToggleLanguage(): void;
}

/** Everything that touches the main game page lives here. */
export class GameView {
  private readonly homeScreen = requireElement("#home-screen");
  private readonly gameScreen = requireElement("#game-screen");
  private readonly historyScreen = requireElement("#history-screen");
  private readonly resultBanner = requireElement("#result-banner");
  private readonly resultText = requireElement("#result-text");

  private readonly playerScore = requireElement("#player-score");
  private readonly aiScore = requireElement("#ai-score");
  private readonly homePlayerScore = requireElement("#home-player-score");
  private readonly homeAiScore = requireElement("#home-ai-score");

  private readonly playerChoice = requireElement("#player-choice-display");
  private readonly aiChoice = requireElement("#ai-choice-display");
  private readonly aiName = requireElement("#ai-name");
  private readonly choiceButtons = requireElements<HTMLButtonElement>(".choice-button");

  private readonly progressLabel = requireElement("#progress-label");
  private readonly progressValue = requireElement("#progress-value");
  private readonly progressFill = requireElement("#progress-fill");
  private readonly progressTrack = requireElement("#progress-track");

  private readonly pauseButton = requireElement<HTMLButtonElement>("#pause-button");
  private readonly finishButton = requireElement<HTMLButtonElement>("#finish-button");
  private readonly toast = requireElement("#toast");
  private readonly toastTimer = new DelayedAction();

  private paused = false;
  private difficulty: Difficulty | null = null;
  private shown: { player: Choice | null; ai: Choice | null } = { player: null, ai: null };

  bind(handlers: ViewHandlers): void {
    for (const mode of Object.keys(MODE_BUTTON_SELECTOR) as Mode[]) {
      requireElement(MODE_BUTTON_SELECTOR[mode]).addEventListener("click", () =>
        handlers.onModeSelected(mode),
      );
    }

    for (const button of this.choiceButtons) {
      button.addEventListener("click", () => {
        const choice = button.dataset.choice;
        if (isChoice(choice)) handlers.onChoice(choice);
      });
    }

    this.pauseButton.addEventListener("click", handlers.onTogglePause);
    this.finishButton.addEventListener("click", handlers.onFinish);
    requireElement("#restart-button").addEventListener("click", handlers.onRestart);
    requireElement("#home-button").addEventListener("click", handlers.onHome);
    requireElement("#quit-button").addEventListener("click", handlers.onQuit);
    requireElement("#language-toggle").addEventListener("click", handlers.onToggleLanguage);
  }

  // Screens

  showHome(): void {
    this.show("home");
  }

  showGame(): void {
    this.show("game");
  }

  showHistory(): void {
    this.show("history");
  }

  // Banner and toast

  setBanner({ message, tone, icon }: Banner): void {
    this.resultText.replaceChildren(...(icon ? [createIcon(icon), " "] : []), message);
    this.resultBanner.dataset.tone = tone;
  }

  showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    this.toastTimer.schedule(() => this.toast.classList.remove("visible"), TOAST_DURATION_MS);
  }

  confirm(question: string): boolean {
    return window.confirm(question);
  }

  // Scores and choices

  renderScores(player: number, ai: number): void {
    this.playerScore.textContent = String(player);
    this.aiScore.textContent = String(ai);
    this.homePlayerScore.textContent = String(player);
    this.homeAiScore.textContent = String(ai);

    this.playerScore.style.color = scoreColor(player, ai, COLOR.win);
    this.aiScore.style.color = scoreColor(ai, player, COLOR.lose);
  }

  resetChoices(): void {
    this.shown = { player: null, ai: null };
    this.playerChoice.textContent = "?";
    this.aiChoice.textContent = "?";
    this.relabelChoices();
  }

  showChoices(player: Choice, ai: Choice): void {
    this.shown = { player, ai };
    this.animateChoice(this.playerChoice, player);
    this.animateChoice(this.aiChoice, ai);
    this.relabelChoices();
  }

  /** Shows which level the AI is playing at, next to its name. `null` on the menu. */
  setDifficulty(difficulty: Difficulty | null): void {
    this.difficulty = difficulty;
    this.renderAiName();
  }

  /** Writes the text this view draws itself again, after the language changed. */
  refreshLanguage(match: Match | null): void {
    this.renderAiName();
    this.renderPauseLabel();
    this.relabelChoices();
    if (match) this.renderProgress(match);
  }

  setChoicesEnabled(enabled: boolean): void {
    for (const button of this.choiceButtons) button.disabled = !enabled;
  }

  // Progress and pause

  renderProgress(match: Match): void {
    const percent = Math.min(100, Math.max(0, match.progressPercent));

    // Free play has no limit, so instead of a bar it just counts the rounds played.
    this.progressTrack.hidden = match.mode === "free";

    switch (match.mode) {
      case "time":
        this.progressLabel.textContent = t("progress.time");
        this.progressValue.textContent = formatTimeLeft(match.remaining);
        this.progressValue.style.color = match.remaining > LOW_TIME_THRESHOLD_SECONDS ? COLOR.win : COLOR.lose;
        break;
      case "rounds":
        this.progressLabel.textContent = t("progress.rounds");
        this.progressValue.textContent = t("progress.roundsValue", { left: match.remaining, total: match.total });
        this.progressValue.style.color = COLOR.accent;
        break;
      case "free":
        this.progressLabel.textContent = t("progress.played");
        this.progressValue.textContent = String(match.rounds.length);
        this.progressValue.style.color = COLOR.win;
        break;
    }

    this.progressFill.style.width = `${percent}%`;
    this.progressFill.style.background = progressFillColor(percent);
    this.progressTrack.setAttribute("aria-valuenow", String(Math.round(percent)));
  }

  /** The Finish button only exists in free play, which has no end of its own. */
  setFinishVisible(visible: boolean): void {
    this.finishButton.hidden = !visible;
  }

  setPauseVisible(visible: boolean): void {
    this.pauseButton.hidden = !visible;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.renderPauseLabel();
  }

  // Helpers

  private show(screen: Screen): void {
    this.homeScreen.hidden = screen !== "home";
    this.gameScreen.hidden = screen !== "game";
    this.historyScreen.hidden = screen !== "history";
    document.body.dataset.screen = screen;
    // Screens have different heights; always start at the top instead of wherever the old scroll position lands.
    window.scrollTo(0, 0);
  }

  private renderPauseLabel(): void {
    setIconLabel(this.pauseButton, this.paused ? "play" : "pause", t(this.paused ? "game.resume" : "game.pause"));
  }

  private renderAiName(): void {
    const level = this.difficulty ? [make("span", "fighter-level", t(`difficulty.${this.difficulty}`))] : [];
    this.aiName.replaceChildren(t("arena.ai"), ...level);
  }

  private relabelChoices(): void {
    const { player, ai } = this.shown;
    this.playerChoice.setAttribute("aria-label", player ? t(`choice.${player}`) : t("arena.playerNone"));
    this.aiChoice.setAttribute("aria-label", ai ? t(`choice.${ai}`) : t("arena.aiNone"));
  }

  private animateChoice(element: HTMLElement, choice: Choice): void {
    element.replaceChildren(createIcon(choice));
    element.classList.remove("animate");
    // Force a reflow so identical consecutive choices replay the animation.
    void element.offsetWidth;
    element.classList.add("animate");
  }
}

function scoreColor(own: number, other: number, leadingColor: string): string {
  if (own > other) return leadingColor;
  if (own < other) return COLOR.muted;
  return COLOR.tie;
}

function progressFillColor(percent: number): string {
  if (percent > 70) return COLOR.lose;
  if (percent > 30) return COLOR.win;
  return COLOR.calm;
}

function setIconLabel(button: HTMLElement, icon: IconName, text: string): void {
  const iconWrapper = document.createElement("span");
  iconWrapper.className = "btn-icon";
  iconWrapper.setAttribute("aria-hidden", "true");
  iconWrapper.append(createIcon(icon));
  button.replaceChildren(iconWrapper, ` ${text}`);
}
