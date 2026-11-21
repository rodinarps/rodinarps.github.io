import { DEFAULT_DIFFICULTY, isDifficulty } from "../core/difficulty";
import type { Difficulty } from "../core/types";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../i18n";
import type { StorageLike } from "./browserStorage";

export const PREFERENCES_STORAGE_KEY = "rodinarps:preferences";

export interface Preferences {
  readonly language: Language;
  readonly difficulty: Difficulty;
}

export const DEFAULT_PREFERENCES: Preferences = {
  language: DEFAULT_LANGUAGE,
  difficulty: DEFAULT_DIFFICULTY,
};

/** Remembers the language and difficulty you last chose, in this browser only. */
export class PreferencesStore {
  constructor(private readonly storage: StorageLike | null) {}

  /** Anything missing, unreadable or unknown falls back to the defaults. */
  load(): Preferences {
    if (!this.storage) return DEFAULT_PREFERENCES;
    try {
      const raw = this.storage.getItem(PREFERENCES_STORAGE_KEY);
      const saved: unknown = raw === null ? null : JSON.parse(raw);
      const values = typeof saved === "object" && saved !== null ? (saved as Record<string, unknown>) : {};
      return {
        language: isLanguage(values.language) ? values.language : DEFAULT_PREFERENCES.language,
        difficulty: isDifficulty(values.difficulty) ? values.difficulty : DEFAULT_PREFERENCES.difficulty,
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  /** Returns `false` if the choice could not be saved (the page still uses it until it is closed). */
  save(change: Partial<Preferences>): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...this.load(), ...change }));
      return true;
    } catch {
      return false;
    }
  }
}
