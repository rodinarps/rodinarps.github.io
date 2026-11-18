import { LOW_TIME_THRESHOLD_SECONDS, TOAST_DURATION_MS } from "../core/constants";
import type { Match } from "../core/match";
import { isChoice } from "../core/rules";
import type { Choice, Mode } from "../core/types";
import { DelayedAction } from "../utils/timers";
import { requireElement, requireElements } from "./dom";
import { formatTimeLeft } from "./format";
import { createIcon, type IconName } from "./icons";
import type { Tone } from "./messages";

const COLOR = {
  win: "var(--win)",
  lose: "var(--lose)",
  tie: "var(--tie)",
  muted: "var(--muted)",
  accent: "var(--orange-light)",
  calm: "var(--purple)",
} as const;

const MODE_BUTTON_SELECTOR: Record<Mode, string> = {
  time: "#choose-time",
  rounds: "#choose-rounds",
};

export interface ViewHandlers {
  onModeSelected(mode: Mode): void;
  onChoice(choice: Choice): void;
  onTogglePause(): void;
  onRestart(): void;
  onHome(): void;
  onQuit(): void;
}

/** Everything that touches the main game page lives here. */
export class GameView {
  private readonly homeScreen = requireElement("#home-screen");
  private readonly gameScreen = requireElement("#game-screen");
  private readonly resultBanner = requireElement("#result-banner");
  private readonly resultText = requireElement("#result-text");

  private readonly playerScore = requireElement("#player-score");
  private readonly cpuScore = requireElement("#cpu-score");
  private readonly homePlayerScore = requireElement("#home-player-score");
  private readonly homeCpuScore = requireElement("#home-cpu-score");

  private readonly playerChoice = requireElement("#player-choice-display");
  private readonly cpuChoice = requireElement("#cpu-choice-display");
  private readonly choiceButtons = requireElements<HTMLButtonElement>(".choice-button");

  private readonly progressLabel = requireElement("#progress-label");
  private readonly progressValue = requireElement("#progress-value");
  private readonly progressFill = requireElement("#progress-fill");
  private readonly progressTrack = requireElement("#progress-track");

  private readonly pauseButton = requireElement<HTMLButtonElement>("#pause-button");
  private readonly toast = requireElement("#toast");
  private readonly toastTimer = new DelayedAction();

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
    requireElement("#restart-button").addEventListener("click", handlers.onRestart);
    requireElement("#home-button").addEventListener("click", handlers.onHome);
    requireElement("#quit-button").addEventListener("click", handlers.onQuit);
  }

  // Screens

  showHome(): void {
    this.homeScreen.hidden = false;
    this.gameScreen.hidden = true;
  }

  showGame(): void {
    this.homeScreen.hidden = true;
    this.gameScreen.hidden = false;
  }

  // Banner and toast

  setBanner(message: string, tone: Tone = "neutral", icon?: IconName): void {
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

  renderScores(player: number, cpu: number): void {
    this.playerScore.textContent = String(player);
    this.cpuScore.textContent = String(cpu);
    this.homePlayerScore.textContent = String(player);
    this.homeCpuScore.textContent = String(cpu);

    this.playerScore.style.color = scoreColor(player, cpu, COLOR.win);
    this.cpuScore.style.color = scoreColor(cpu, player, COLOR.lose);
  }

  resetChoices(): void {
    this.setChoiceDisplay(this.playerChoice, "?", "Your choice not made yet");
    this.setChoiceDisplay(this.cpuChoice, "?", "Computer choice not made yet");
  }

  showChoices(player: Choice, cpu: Choice): void {
    this.animateChoice(this.playerChoice, player);
    this.animateChoice(this.cpuChoice, cpu);
  }

  setChoicesEnabled(enabled: boolean): void {
    for (const button of this.choiceButtons) button.disabled = !enabled;
  }

  // Progress and pause

  renderProgress(match: Match): void {
    const isTimeMode = match.mode === "time";
    const percent = Math.min(100, Math.max(0, match.progressPercent));

    this.progressLabel.textContent = isTimeMode ? "TIME LEFT" : "ROUNDS LEFT";
    this.progressValue.textContent = isTimeMode
      ? formatTimeLeft(match.remaining)
      : `${match.remaining} / ${match.total}`;
    this.progressValue.style.color = isTimeMode
      ? match.remaining > LOW_TIME_THRESHOLD_SECONDS
        ? COLOR.win
        : COLOR.lose
      : COLOR.accent;

    this.progressFill.style.width = `${percent}%`;
    this.progressFill.style.background = progressFillColor(percent);
    this.progressTrack.setAttribute("aria-valuenow", String(Math.round(percent)));
  }

  setPauseVisible(visible: boolean): void {
    this.pauseButton.hidden = !visible;
  }

  setPaused(paused: boolean): void {
    setIconLabel(this.pauseButton, paused ? "play" : "pause", paused ? "Resume" : "Pause");
  }

  // Helpers

  private animateChoice(element: HTMLElement, choice: Choice): void {
    this.setChoiceDisplay(element, createIcon(choice), choice);
    element.classList.remove("animate");
    // Force a reflow so identical consecutive choices replay the animation.
    void element.offsetWidth;
    element.classList.add("animate");
  }

  private setChoiceDisplay(element: HTMLElement, content: string | Node, label: string): void {
    element.replaceChildren(content);
    element.setAttribute("aria-label", label);
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
  iconWrapper.setAttribute("aria-hidden", "true");
  iconWrapper.append(createIcon(icon));
  button.replaceChildren(iconWrapper, ` ${text}`);
}
