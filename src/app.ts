import { CLOCK_TICK_MS, MODE_CONFIG, RESULT_DISPLAY_DURATION_MS } from "./core/constants";
import { Match } from "./core/match";
import type { Choice, Mode } from "./core/types";
import { finalBanner, MESSAGES, roundBanner } from "./ui/messages";
import type { SettingsDialog } from "./ui/settingsDialog";
import type { GameView } from "./ui/view";
import { DelayedAction, RepeatingTimer } from "./utils/timers";

/** Connects the game rules (Match) to the page (GameView + SettingsDialog). */
export class App {
  private match: Match | null = null;
  private readonly lastSetting: Record<Mode, number> = {
    time: MODE_CONFIG.time.defaultValue,
    rounds: MODE_CONFIG.rounds.defaultValue,
  };

  private readonly clock = new RepeatingTimer();
  private readonly autoReturnHome = new DelayedAction();

  constructor(
    private readonly view: GameView,
    private readonly settingsDialog: SettingsDialog,
  ) {}

  start(): void {
    this.view.bind({
      onModeSelected: (mode) => void this.chooseSettings(mode),
      onChoice: (choice) => this.playRound(choice),
      onTogglePause: () => this.togglePause(),
      onRestart: () => this.requestRestart(),
      onHome: () => this.requestHome(),
      onQuit: () => this.view.showToast(MESSAGES.quit),
    });
    this.returnHome();
  }

  // Match lifecycle

  private async chooseSettings(mode: Mode): Promise<void> {
    const setting = await this.settingsDialog.open(mode, this.lastSetting[mode]);
    if (setting !== null) this.startMatch(mode, setting);
  }

  private startMatch(mode: Mode, setting: number): void {
    this.stopTimers();
    this.lastSetting[mode] = setting;
    const match = new Match(mode, setting);
    this.match = match;

    this.view.resetChoices();
    this.view.renderScores(0, 0);
    this.view.renderProgress(match);
    this.view.setChoicesEnabled(true);
    this.view.setPauseVisible(mode === "time");
    this.view.setPaused(false);
    this.view.showGame();
    this.view.setBanner(MESSAGES.chooseMove);

    if (mode === "time") this.startClock();
  }

  private playRound(choice: Choice): void {
    const match = this.match;
    const outcome = match?.playRound(choice);
    if (!match || !outcome) return;

    const { message, tone, icon } = roundBanner(outcome);
    this.view.showChoices(outcome.playerChoice, outcome.cpuChoice);
    this.view.renderScores(match.playerScore, match.cpuScore);
    this.view.setBanner(message, tone, icon);
    this.view.renderProgress(match);

    if (match.status === "finished") this.finishMatch(match);
  }

  private togglePause(): void {
    const match = this.match;
    if (!match) return;

    match.togglePause();
    if (match.status === "paused") {
      this.clock.stop();
      this.view.setPaused(true);
      this.view.setChoicesEnabled(false);
      this.view.setBanner(MESSAGES.paused);
    } else if (match.status === "playing") {
      this.view.setPaused(false);
      this.view.setChoicesEnabled(true);
      this.view.setBanner(MESSAGES.chooseMove);
      this.startClock();
    }
  }

  private finishMatch(match: Match): void {
    this.clock.stop();
    this.view.setChoicesEnabled(false);
    this.view.setPauseVisible(false);

    const { message, tone, icon } = finalBanner(match.playerScore, match.cpuScore);
    this.view.setBanner(message, tone, icon);
    this.autoReturnHome.schedule(() => this.returnHome(), RESULT_DISPLAY_DURATION_MS);
  }

  private requestRestart(): void {
    const match = this.match;
    if (!match || !this.view.confirm(MESSAGES.confirmRestart)) return;

    this.startMatch(match.mode, match.setting);
    this.view.showToast(MESSAGES.restarted);
  }

  private requestHome(): void {
    if (this.view.confirm(MESSAGES.confirmHome)) this.returnHome();
  }

  private returnHome(): void {
    this.stopTimers();
    this.match = null;

    this.view.showHome();
    this.view.resetChoices();
    this.view.renderScores(0, 0);
    this.view.setChoicesEnabled(false);
    this.view.setBanner(MESSAGES.welcome);
  }

  // Timers

  private startClock(): void {
    this.clock.start(() => {
      const match = this.match;
      if (!match) return;

      match.tick();
      this.view.renderProgress(match);
      if (match.status === "finished") this.finishMatch(match);
    }, CLOCK_TICK_MS);
  }

  private stopTimers(): void {
    this.clock.stop();
    this.autoReturnHome.cancel();
  }
}
