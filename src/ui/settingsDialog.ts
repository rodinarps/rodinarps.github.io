import { MODE_CONFIG, type ModeConfig } from "../core/constants";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "../core/difficulty";
import type { Difficulty, Mode } from "../core/types";
import { t } from "../i18n";
import { make, requireElement } from "./dom";
import { createIcon, MODE_ICON } from "./icons";

export interface SettingsResult {
  /** Minutes (time mode) or number of rounds (rounds mode). */
  readonly setting: number;
  readonly difficulty: Difficulty;
}

/** The "how long / how many rounds, and how hard?" dialog. */
export class SettingsDialog {
  private readonly dialog = requireElement<HTMLDialogElement>("#settings-dialog");
  private readonly form = requireElement<HTMLFormElement>("#settings-form");
  private readonly icon = requireElement("#dialog-icon");
  private readonly title = requireElement("#dialog-title");
  private readonly subtitle = requireElement("#dialog-subtitle");
  private readonly presetGrid = requireElement("#preset-grid");
  private readonly input = requireElement<HTMLInputElement>("#custom-value");
  private readonly unit = requireElement("#custom-unit");
  private readonly hint = requireElement("#input-hint");
  private readonly difficultyGrid = requireElement("#difficulty-grid");
  private readonly difficultyHint = requireElement("#difficulty-hint");

  private mode: Mode = "time";
  private difficulty: Difficulty = DEFAULT_DIFFICULTY;
  private initialValue = MODE_CONFIG.time.defaultValue;
  private submitted: SettingsResult | null = null;
  private pendingResolve: ((result: SettingsResult | null) => void) | null = null;

  constructor() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit();
    });
    this.dialog.addEventListener("close", () => this.settle(this.submitted));

    requireElement("#cancel-settings").addEventListener("click", () => this.dialog.close());
    requireElement("#minus-value").addEventListener("click", () => this.step(-1));
    requireElement("#plus-value").addEventListener("click", () => this.step(1));

    this.input.addEventListener("input", () => this.highlightMatchingPreset());
    this.input.addEventListener("change", () => {
      if (this.input.value !== "") this.setValue(this.normalize(Number(this.input.value)));
    });
  }

  /** Resolves with the chosen settings, or `null` if the dialog was cancelled. */
  open(mode: Mode, initialValue: number, initialDifficulty: Difficulty): Promise<SettingsResult | null> {
    this.settle(null);
    this.mode = mode;
    this.initialValue = initialValue;
    this.submitted = null;

    const config = this.config;
    this.dialog.dataset.mode = mode;
    this.icon.replaceChildren(createIcon(MODE_ICON[mode]));
    this.title.textContent = t(`mode.${mode}.title`);
    this.subtitle.textContent = t(`mode.${mode}.subtitle`);
    this.unit.textContent = t(`mode.${mode}.unit`);
    this.hint.textContent = t(`mode.${mode}.hint`, { min: config.min, max: config.max });
    this.input.min = String(config.min);
    this.input.max = String(config.max);

    this.renderPresets();
    this.setValue(initialValue);
    this.renderDifficulties(initialDifficulty);

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      if (!this.dialog.open) this.dialog.showModal();
    });
  }

  private get config(): ModeConfig {
    return MODE_CONFIG[this.mode];
  }

  private submit(): void {
    const rawValue = Number(this.input.value);
    if (!Number.isFinite(rawValue)) {
      this.setValue(this.initialValue);
      return;
    }
    const setting = this.normalize(rawValue);
    this.setValue(setting);
    this.submitted = { setting, difficulty: this.difficulty };
    this.dialog.close();
  }

  private step(delta: number): void {
    const current = Number(this.input.value) || this.config.min;
    this.setValue(this.normalize(current + delta));
  }

  private normalize(value: number): number {
    const { min, max } = this.config;
    return Math.min(max, Math.max(min, Math.trunc(value)));
  }

  private setValue(value: number): void {
    this.input.value = String(value);
    this.highlightMatchingPreset();
  }

  private renderPresets(): void {
    const unit = t(`mode.${this.mode}.unit`);
    this.presetGrid.replaceChildren(
      ...this.config.presets.map((preset) => {
        const button = make("button", "preset-button");
        button.type = "button";
        button.dataset.value = String(preset);
        button.append(make("strong", "", String(preset)), make("span", "", unit));
        button.addEventListener("click", () => this.setValue(preset));
        return button;
      }),
    );
  }

  private highlightMatchingPreset(): void {
    const current = Number(this.input.value);
    for (const button of this.presetGrid.querySelectorAll<HTMLButtonElement>(".preset-button")) {
      button.classList.toggle("selected", Number(button.dataset.value) === current);
    }
  }

  private renderDifficulties(selected: Difficulty): void {
    this.difficulty = selected;
    this.difficultyGrid.replaceChildren(
      ...DIFFICULTIES.map((difficulty) => {
        const button = make("button", "difficulty-button", t(`difficulty.${difficulty}`));
        button.type = "button";
        button.dataset.difficulty = difficulty;
        button.addEventListener("click", () => this.selectDifficulty(difficulty));
        return button;
      }),
    );
    this.highlightDifficulty();
  }

  private selectDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.highlightDifficulty();
  }

  private highlightDifficulty(): void {
    for (const button of this.difficultyGrid.querySelectorAll<HTMLButtonElement>(".difficulty-button")) {
      const isSelected = button.dataset.difficulty === this.difficulty;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    }
    this.difficultyHint.textContent = t(`difficulty.${this.difficulty}.description`);
  }

  private settle(result: SettingsResult | null): void {
    this.pendingResolve?.(result);
    this.pendingResolve = null;
  }
}
