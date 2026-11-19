import { CLOCK_TICK_MS, MAX_IMPORT_BYTES, MODE_CONFIG, RESULT_DISPLAY_DURATION_MS } from "./core/constants";
import { Match } from "./core/match";
import { createMatchRecord } from "./core/record";
import { computeStats } from "./core/stats";
import type { Choice, Mode } from "./core/types";
import { HistoryImportError, type HistoryStore } from "./storage/historyStore";
import { downloadTextFile } from "./ui/download";
import { formatBackupFileName } from "./ui/format";
import type { HistoryView } from "./ui/historyView";
import { finalBanner, HISTORY_TEXT, importMessage, MESSAGES, roundBanner } from "./ui/messages";
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
  private warnedAboutStorage = false;

  constructor(
    private readonly view: GameView,
    private readonly settingsDialog: SettingsDialog,
    private readonly historyView: HistoryView,
    private readonly history: HistoryStore,
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
    this.historyView.bind({
      onOpen: () => this.openHistory(),
      onBack: () => this.returnHome(),
      onExport: () => this.exportHistory(),
      onImportFile: (file) => void this.importHistory(file),
      onClear: () => this.clearHistory(),
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
    this.saveMatch(match);
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
    this.historyView.renderCount(this.history.list().length);
  }

  // History

  /** Only finished matches are saved; restarting or leaving a match early saves nothing. */
  private saveMatch(match: Match): void {
    if (this.history.add(createMatchRecord(match))) return;
    if (this.warnedAboutStorage) return;
    this.warnedAboutStorage = true;
    this.view.showToast(MESSAGES.historyNotSaved);
  }

  private openHistory(): void {
    this.renderHistory();
    this.view.setBanner(HISTORY_TEXT.banner);
    this.view.showHistory();
  }

  private renderHistory(): void {
    const records = this.history.list();
    this.historyView.render(records, computeStats(records), this.history.isAvailable);
  }

  private exportHistory(): void {
    if (this.history.list().length === 0) {
      this.view.showToast(MESSAGES.nothingToExport);
      return;
    }
    downloadTextFile(formatBackupFileName(), this.history.exportJson());
    this.view.showToast(MESSAGES.backupDownloaded);
  }

  private async importHistory(file: File): Promise<void> {
    if (file.size > MAX_IMPORT_BYTES) {
      this.view.showToast(MESSAGES.fileTooLarge);
      return;
    }
    try {
      const summary = this.history.importJson(await file.text());
      this.renderHistory();
      this.view.showToast(importMessage(summary));
    } catch (error) {
      this.view.showToast(error instanceof HistoryImportError ? error.message : MESSAGES.importFailed);
    }
  }

  private clearHistory(): void {
    if (!this.view.confirm(MESSAGES.confirmClearHistory)) return;
    this.view.showToast(this.history.clear() ? MESSAGES.historyCleared : MESSAGES.historyNotCleared);
    this.renderHistory();
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
