import { MODE_CONFIG, type ModeConfig } from "../core/constants";
import type { Mode } from "../core/types";
import { requireElement } from "./dom";
import { createIcon, MODE_ICON } from "./icons";

/** The "how long / how many rounds?" dialog. */
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

  private mode: Mode = "time";
  private initialValue = MODE_CONFIG.time.defaultValue;
  private submittedValue: number | null = null;
  private pendingResolve: ((value: number | null) => void) | null = null;

  constructor() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit();
    });
    this.dialog.addEventListener("close", () => this.settle(this.submittedValue));

    requireElement("#cancel-settings").addEventListener("click", () => this.dialog.close());
    requireElement("#minus-value").addEventListener("click", () => this.step(-1));
    requireElement("#plus-value").addEventListener("click", () => this.step(1));

    this.input.addEventListener("input", () => this.highlightMatchingPreset());
    this.input.addEventListener("change", () => {
      if (this.input.value !== "") this.setValue(this.normalize(Number(this.input.value)));
    });
  }

  /** Resolves with the chosen value, or `null` if the dialog was cancelled. */
  open(mode: Mode, initialValue: number): Promise<number | null> {
    this.settle(null);
    this.mode = mode;
    this.initialValue = initialValue;
    this.submittedValue = null;

    const config = this.config;
    this.dialog.dataset.mode = mode;
    this.icon.replaceChildren(createIcon(MODE_ICON[mode]));
    this.title.textContent = config.title;
    this.subtitle.textContent = config.subtitle;
    this.unit.textContent = config.unit;
    this.hint.textContent = `Choose between ${config.min} and ${config.max} ${config.unitLabel}.`;
    this.input.min = String(config.min);
    this.input.max = String(config.max);

    this.renderPresets();
    this.setValue(initialValue);

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
    this.submittedValue = this.normalize(rawValue);
    this.setValue(this.submittedValue);
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
    const { presets, unit } = this.config;
    this.presetGrid.replaceChildren(
      ...presets.map((preset) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "preset-button";
        button.dataset.value = String(preset);

        const amount = document.createElement("strong");
        amount.textContent = String(preset);
        const unitLabel = document.createElement("span");
        unitLabel.textContent = unit;
        button.append(amount, unitLabel);

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

  private settle(value: number | null): void {
    this.pendingResolve?.(value);
    this.pendingResolve = null;
  }
}
