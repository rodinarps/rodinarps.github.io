import { MODE_CONFIG } from "./constants";
import type { CountedMode, Mode } from "./types";

export function isCountedMode(mode: Mode): mode is CountedMode {
  return mode !== "free";
}

/**
 * Arabic keyboards type Arabic-Indic digits (٣٠) and Persian keyboards type Persian ones (۳۰).
 * Both mean the same as 30, so they are turned into ordinary digits before anything is checked.
 */
export function normalizeDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => String((digit.codePointAt(0) as number) & 0xf));
}

export type SettingCheck = { readonly ok: true; readonly value: number } | { readonly ok: false };

/**
 * Checks what was typed for minutes or rounds. Only a whole number inside the mode's limits is
 * accepted; anything else is rejected, never quietly changed into something else.
 */
export function validateSetting(mode: CountedMode, typed: string): SettingCheck {
  const text = normalizeDigits(typed).trim();
  if (!/^\d+$/.test(text)) return { ok: false };

  const value = Number(text);
  const { min, max } = MODE_CONFIG[mode];
  return value >= min && value <= max ? { ok: true, value } : { ok: false };
}
