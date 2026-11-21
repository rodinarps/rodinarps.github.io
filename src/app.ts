import { CLOCK_TICK_MS, MAX_IMPORT_BYTES, MODE_CONFIG, RESULT_DISPLAY_DURATION_MS } from "./core/constants";
import { Match } from "./core/match";
import { createMatchRecord } from "./core/record";
import { computeStats } from "./core/stats";
import type { Choice, Difficulty, Mode } from "./core/types";
import { otherLanguage, t, type Language } from "./i18n";
import type { HistoryStore } from "./storage/historyStore";
import type { Preferences, PreferencesStore } from "./storage/preferences";
import { downloadTextFile } from "./ui/download";
import { formatBackupFileName } from "./ui/format";
import type { HistoryView } from "./ui/historyView";
import { applyLanguage } from "./ui/language";
import { buildBanner, importErrorMessage, importMessage, type BannerState } from "./ui/messages";
import type { SettingsDialog } from "./ui/settingsDialog";
import type { GameView } from "./ui/view";
import { DelayedAction, RepeatingTimer } from "./utils/timers";

type Screen = "home" | "game" | "history";

/** Connects the game rules (Match) to the page (GameView, dialogs, history, language). */
export class App {
  private match: Match | null = null;
  private screen: Screen = "home";
  private banner: BannerState = { kind: "welcome" };
  private language: Language;
  private difficulty: Difficulty;
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
    private readonly preferencesStore: PreferencesStore,
    preferences: Preferences,
  ) {
    this.language = preferences.language;
    this.difficulty = preferences.difficulty;
  }

  start(): void {
    this.view.bind({
      onModeSelected: (mode) => void this.chooseSettings(mode),
      onChoice: (choice) => this.playRound(choice),
      onTogglePause: () => this.togglePause(),
      onRestart: () => this.requestRestart(),
      onHome: () => this.requestHome(),
      onQuit: () => this.view.showToast(t("msg.quit")),
      onToggleLanguage: () => this.toggleLanguage(),
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

  // Language

  private toggleLanguage(): void {
    this.language = otherLanguage(this.language);
    applyLanguage(this.language);
    this.preferencesStore.save({ language: this.language });

    this.view.setBanner(buildBanner(this.banner));
    this.view.refreshLanguage(this.match);
    if (this.screen === "history") this.renderHistory();
  }

  private showBanner(state: BannerState): void {
    this.banner = state;
    this.view.setBanner(buildBanner(state));
  }

  // Match lifecycle

  private async chooseSettings(mode: Mode): Promise<void> {
    const result = await this.settingsDialog.open(mode, this.lastSetting[mode], this.difficulty);
    if (result === null) return;

    this.difficulty = result.difficulty;
    this.preferencesStore.save({ difficulty: result.difficulty });
    this.startMatch(mode, result.setting, result.difficulty);
  }

  private startMatch(mode: Mode, setting: number, difficulty: Difficulty): void {
    this.stopTimers();
    this.lastSetting[mode] = setting;
    const match = new Match(mode, setting, difficulty);
    this.match = match;
    this.screen = "game";

    this.view.resetChoices();
    this.view.renderScores(0, 0);
    this.view.renderProgress(match);
    this.view.setDifficulty(difficulty);
    this.view.setChoicesEnabled(true);
    this.view.setPauseVisible(mode === "time");
    this.view.setPaused(false);
    this.view.showGame();
    this.showBanner({ kind: "chooseMove" });

    if (mode === "time") this.startClock();
  }

  private playRound(choice: Choice): void {
    const match = this.match;
    const outcome = match?.playRound(choice);
    if (!match || !outcome) return;

    this.view.showChoices(outcome.playerChoice, outcome.aiChoice);
    this.view.renderScores(match.playerScore, match.aiScore);
    this.showBanner({ kind: "round", outcome });
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
      this.showBanner({ kind: "paused" });
    } else if (match.status === "playing") {
      this.view.setPaused(false);
      this.view.setChoicesEnabled(true);
      this.showBanner({ kind: "chooseMove" });
      this.startClock();
    }
  }

  private finishMatch(match: Match): void {
    this.clock.stop();
    this.view.setChoicesEnabled(false);
    this.view.setPauseVisible(false);

    this.showBanner({ kind: "final", playerScore: match.playerScore, aiScore: match.aiScore });
    this.autoReturnHome.schedule(() => this.returnHome(), RESULT_DISPLAY_DURATION_MS);
    this.saveMatch(match);
  }

  private requestRestart(): void {
    const match = this.match;
    if (!match || !this.view.confirm(t("msg.confirmRestart"))) return;

    this.startMatch(match.mode, match.setting, match.difficulty);
    this.view.showToast(t("msg.restarted"));
  }

  private requestHome(): void {
    if (this.view.confirm(t("msg.confirmHome"))) this.returnHome();
  }

  private returnHome(): void {
    this.stopTimers();
    this.match = null;
    this.screen = "home";

    this.view.showHome();
    this.view.resetChoices();
    this.view.renderScores(0, 0);
    this.view.setDifficulty(null);
    this.view.setChoicesEnabled(false);
    this.showBanner({ kind: "welcome" });
    this.historyView.renderCount(this.history.list().length);
  }

  // History

  /** Only finished matches are saved; restarting or leaving a match early saves nothing. */
  private saveMatch(match: Match): void {
    if (this.history.add(createMatchRecord(match))) return;
    if (this.warnedAboutStorage) return;
    this.warnedAboutStorage = true;
    this.view.showToast(t("msg.historyNotSaved"));
  }

  private openHistory(): void {
    this.screen = "history";
    this.renderHistory();
    this.showBanner({ kind: "history" });
    this.view.showHistory();
  }

  private renderHistory(): void {
    const records = this.history.list();
    this.historyView.render(records, computeStats(records), this.history.isAvailable);
  }

  private exportHistory(): void {
    if (this.history.list().length === 0) {
      this.view.showToast(t("msg.nothingToExport"));
      return;
    }
    downloadTextFile(formatBackupFileName(), this.history.exportJson());
    this.view.showToast(t("msg.backupDownloaded"));
  }

  private async importHistory(file: File): Promise<void> {
    if (file.size > MAX_IMPORT_BYTES) {
      this.view.showToast(t("msg.fileTooLarge"));
      return;
    }
    try {
      const summary = this.history.importJson(await file.text());
      this.renderHistory();
      this.view.showToast(importMessage(summary));
    } catch (error) {
      this.view.showToast(importErrorMessage(error));
    }
  }

  private clearHistory(): void {
    if (!this.view.confirm(t("msg.confirmClearHistory"))) return;
    this.view.showToast(t(this.history.clear() ? "msg.historyCleared" : "msg.historyNotCleared"));
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
