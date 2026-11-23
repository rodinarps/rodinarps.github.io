import { MODE_CONFIG } from "../core/constants";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "../core/difficulty";
import { isCountedMode, validateSetting } from "../core/settings";
import type { CountedMode, Difficulty, Mode } from "../core/types";
import { t } from "../i18n";
import { make, requireElement } from "./dom";
import { createIcon, MODE_ICON } from "./icons";

export interface SettingsResult {
  /** Minutes (time mode), number of rounds (rounds mode), or 0 (free play). */
  readonly setting: number;
  readonly difficulty: Difficulty;
}

/** The "how long / how many rounds, and how hard?" dialog. Free play only asks for the difficulty. */
export class SettingsDialog {
  private readonly dialog = requireElement<HTMLDialogElement>("#settings-dialog");
  private readonly form = requireElement<HTMLFormElement>("#settings-form");
  private readonly icon = requireElement("#dialog-icon");
  private readonly title = requireElement("#dialog-title");
  private readonly subtitle = requireElement("#dialog-subtitle");
  private readonly countSettings = requireElement("#count-settings");
  private readonly presetGrid = requireElement("#preset-grid");
  private readonly input = requireElement<HTMLInputElement>("#custom-value");
  private readonly unit = requireElement("#custom-unit");
  private readonly hint = requireElement("#input-hint");
  private readonly difficultyGrid = requireElement("#difficulty-grid");
  private readonly difficultyHint = requireElement("#difficulty-hint");
  private readonly startButton = requireElement<HTMLButtonElement>("#start-game");

  private mode: Mode = "time";
  private difficulty: Difficulty = DEFAULT_DIFFICULTY;
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

    // What is typed is checked as it is typed and is never changed behind the player's back.
    this.input.addEventListener("input", () => this.refreshValidity());
    this.input.addEventListener("change", () => this.refreshValidity());
  }

  /** Resolves with the chosen settings, or `null` if the dialog was cancelled. */
  open(mode: Mode, initialValue: number, initialDifficulty: Difficulty): Promise<SettingsResult | null> {
    this.settle(null);
    this.mode = mode;
    this.submitted = null;

    this.dialog.dataset.mode = mode;
    this.icon.replaceChildren(createIcon(MODE_ICON[mode]));
    this.title.textContent = t(`mode.${mode}.title`);
    this.subtitle.textContent = t(`mode.${mode}.subtitle`);

    this.countSettings.hidden = !isCountedMode(mode);
    if (isCountedMode(mode)) {
      this.unit.textContent = t(`mode.${mode}.unit`);
      this.renderPresets(mode);
      this.setValue(initialValue);
    } else {
      this.startButton.disabled = false;
    }
    this.renderDifficulties(initialDifficulty);

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      if (!this.dialog.open) this.dialog.showModal();
    });
  }

  private get countedMode(): CountedMode | null {
    return isCountedMode(this.mode) ? this.mode : null;
  }

  private submit(): void {
    const mode = this.countedMode;
    if (mode === null) {
      this.submitted = { setting: 0, difficulty: this.difficulty };
      this.dialog.close();
      return;
    }

    const check = validateSetting(mode, this.input.value);
    if (!check.ok) {
      this.refreshValidity();
      this.input.focus();
      return;
    }
    this.submitted = { setting: check.value, difficulty: this.difficulty };
    this.dialog.close();
  }

  /** The + and - buttons stay inside the limits. */
  private step(delta: number): void {
    const mode = this.countedMode;
    if (mode === null) return;

    const { min, max } = MODE_CONFIG[mode];
    const typed = validateSetting(mode, this.input.value);
    const current = typed.ok ? typed.value : min;
    this.setValue(Math.min(max, Math.max(min, current + delta)));
  }

  private setValue(value: number): void {
    this.input.value = String(value);
    this.refreshValidity();
  }

  /** Shows whether the typed number is allowed: the hint turns into an error and Start is switched off. */
  private refreshValidity(): void {
    const mode = this.countedMode;
    if (mode === null) return;

    const { min, max } = MODE_CONFIG[mode];
    const check = validateSetting(mode, this.input.value);
    this.input.setAttribute("aria-invalid", String(!check.ok));
    this.hint.classList.toggle("error", !check.ok);
    this.hint.textContent = check.ok ? t(`mode.${mode}.hint`, { min, max }) : t("dialog.error.range", { min, max });
    this.startButton.disabled = !check.ok;
    this.highlightMatchingPreset();
  }

  private renderPresets(mode: CountedMode): void {
    const unit = t(`mode.${mode}.unit`);
    this.presetGrid.replaceChildren(
      ...MODE_CONFIG[mode].presets.map((preset) => {
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
    const mode = this.countedMode;
    const typed = mode === null ? null : validateSetting(mode, this.input.value);
    const current = typed?.ok ? typed.value : Number.NaN;
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
