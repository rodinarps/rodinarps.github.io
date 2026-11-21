import { describe, expect, it } from "vitest";
import type { StorageLike } from "../src/storage/browserStorage";
import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY, PreferencesStore } from "../src/storage/preferences";

class FakeStorage implements StorageLike {
  data = new Map<string, string>();
  failWrites = false;
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException("full", "QuotaExceededError");
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

describe("PreferencesStore", () => {
  it("defaults to Arabic and medium", () => {
    expect(DEFAULT_PREFERENCES).toEqual({ language: "ar", difficulty: "medium" });
    expect(new PreferencesStore(new FakeStorage()).load()).toEqual(DEFAULT_PREFERENCES);
  });

  it("remembers what was chosen, one setting at a time", () => {
    const store = new PreferencesStore(new FakeStorage());
    expect(store.save({ language: "en" })).toBe(true);
    expect(store.save({ difficulty: "extreme" })).toBe(true);
    expect(store.load()).toEqual({ language: "en", difficulty: "extreme" });
  });

  it("falls back to the defaults for anything unknown or damaged", () => {
    const storage = new FakeStorage();
    const store = new PreferencesStore(storage);

    storage.setItem(PREFERENCES_STORAGE_KEY, "{ not json");
    expect(store.load()).toEqual(DEFAULT_PREFERENCES);

    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ language: "fr", difficulty: "hard" }));
    expect(store.load()).toEqual({ language: "ar", difficulty: "hard" });

    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify([1, 2]));
    expect(store.load()).toEqual(DEFAULT_PREFERENCES);
  });

  it("copes with storage that is blocked or full", () => {
    expect(new PreferencesStore(null).load()).toEqual(DEFAULT_PREFERENCES);
    expect(new PreferencesStore(null).save({ language: "en" })).toBe(false);

    const full = new FakeStorage();
    full.failWrites = true;
    expect(new PreferencesStore(full).save({ language: "en" })).toBe(false);
  });
});
