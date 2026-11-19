import { beforeEach, describe, expect, it } from "vitest";
import {
  HISTORY_STORAGE_KEY,
  HistoryImportError,
  HistoryStore,
  MAX_STORED_MATCHES,
  type StorageLike,
} from "../src/storage/historyStore";
import type { MatchRecord } from "../src/core/types";

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

function record(id: string, minute = 0): MatchRecord {
  return {
    version: 1,
    id,
    startedAt: new Date(Date.UTC(2026, 10, 18, 12, minute)).toISOString(),
    mode: "rounds",
    setting: 1,
    playerScore: 1,
    cpuScore: 0,
    rounds: "pr",
  };
}

let storage: FakeStorage;
let store: HistoryStore;

beforeEach(() => {
  storage = new FakeStorage();
  store = new HistoryStore(storage);
});

describe("HistoryStore", () => {
  it("starts empty", () => {
    expect(store.list()).toEqual([]);
  });

  it("saves matches and lists them oldest first", () => {
    expect(store.add(record("second", 5))).toBe(true);
    expect(store.add(record("first", 1))).toBe(true);
    expect(store.list().map((saved) => saved.id)).toEqual(["first", "second"]);
  });

  it("does not save the same match twice", () => {
    store.add(record("same"));
    expect(store.add(record("same"))).toBe(true);
    expect(store.list()).toHaveLength(1);
  });

  it("keeps only the newest matches once the limit is reached", () => {
    for (let index = 0; index < MAX_STORED_MATCHES + 3; index += 1) {
      store.add({ ...record(`m${index}`), startedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() });
    }
    const saved = store.list();
    expect(saved).toHaveLength(MAX_STORED_MATCHES);
    expect(saved[0]?.id).toBe("m3");
    expect(saved.at(-1)?.id).toBe(`m${MAX_STORED_MATCHES + 2}`);
  });

  it("clears the history", () => {
    store.add(record("a"));
    expect(store.clear()).toBe(true);
    expect(store.list()).toEqual([]);
  });
});

describe("HistoryStore with bad storage", () => {
  it("treats unreadable saved data as an empty history", () => {
    storage.setItem(HISTORY_STORAGE_KEY, "{ not json");
    expect(store.list()).toEqual([]);
  });

  it("ignores data in an unknown shape or version", () => {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: 99, matches: [record("a")] }));
    expect(store.list()).toEqual([]);
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(store.list()).toEqual([]);
  });

  it("skips damaged entries but keeps the good ones", () => {
    storage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify({ version: 1, matches: [record("good"), { id: "bad" }, null] }),
    );
    expect(store.list().map((saved) => saved.id)).toEqual(["good"]);
  });

  it("reports failure instead of throwing when storage is full", () => {
    storage.failWrites = true;
    expect(store.add(record("a"))).toBe(false);
  });

  it("works without any storage at all", () => {
    const blocked = new HistoryStore(null);
    expect(blocked.isAvailable).toBe(false);
    expect(blocked.list()).toEqual([]);
    expect(blocked.add(record("a"))).toBe(false);
    expect(blocked.clear()).toBe(false);
  });
});

describe("backup export and import", () => {
  it("moves a history to another browser", () => {
    store.add(record("a", 1));
    store.add(record("b", 2));
    const backup = store.exportJson();

    const other = new HistoryStore(new FakeStorage());
    expect(other.importJson(backup)).toEqual({ added: 2, duplicates: 0, invalid: 0 });
    expect(other.list().map((saved) => saved.id)).toEqual(["a", "b"]);
  });

  it("skips matches that are already saved and counts damaged ones", () => {
    store.add(record("a", 1));
    const backup = JSON.stringify({
      app: "RodinaRPS",
      version: 1,
      matches: [record("a", 1), record("b", 2), { nope: true }],
    });
    expect(store.importJson(backup)).toEqual({ added: 1, duplicates: 1, invalid: 1 });
    expect(store.list()).toHaveLength(2);
  });

  it("rejects files that are not a backup", () => {
    expect(() => store.importJson("hello")).toThrow(HistoryImportError);
    expect(() => store.importJson(JSON.stringify({ hello: "world" }))).toThrow(HistoryImportError);
    expect(() => store.importJson(JSON.stringify({ version: 2, matches: [] }))).toThrow(HistoryImportError);
  });

  it("tells you when the imported matches could not be saved", () => {
    storage.failWrites = true;
    const backup = JSON.stringify({ version: 1, matches: [record("a")] });
    expect(() => store.importJson(backup)).toThrow(HistoryImportError);
  });
});
