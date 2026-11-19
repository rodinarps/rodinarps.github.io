import { isMatchRecord, RECORD_VERSION } from "../core/record";
import type { MatchRecord } from "../core/types";

/** Prefixed so other sites under the same github.io address never collide with these keys. */
export const HISTORY_STORAGE_KEY = "rodinarps:history";
/** Oldest matches are dropped beyond this, so the history can't grow forever. */
export const MAX_STORED_MATCHES = 500;
const EXPORT_APP_NAME = "RodinaRPS";

/** The small part of `localStorage` we use, so tests can pass in a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ImportSummary {
  readonly added: number;
  readonly duplicates: number;
  readonly invalid: number;
}

/** The chosen file isn't a RodinaRPS history export, or it couldn't be saved. */
export class HistoryImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryImportError";
  }
}

/** `localStorage` can throw just by being touched (blocked cookies, some private modes). */
export function getBrowserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface HistoryDocument {
  readonly version: number;
  readonly matches: unknown[];
}

function isHistoryDocument(value: unknown): value is HistoryDocument {
  if (typeof value !== "object" || value === null) return false;
  const document = value as Record<string, unknown>;
  return typeof document.version === "number" && Array.isArray(document.matches);
}

/**
 * Saves finished matches in the browser. Everything stays on this device;
 * nothing is sent anywhere. Every method copes with storage being blocked or full.
 */
export class HistoryStore {
  constructor(private readonly storage: StorageLike | null) {}

  get isAvailable(): boolean {
    return this.storage !== null;
  }

  /** Saved matches, oldest first. Damaged entries are skipped. */
  list(): MatchRecord[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(HISTORY_STORAGE_KEY);
      if (raw === null) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!isHistoryDocument(parsed) || parsed.version !== RECORD_VERSION) return [];
      return parsed.matches.filter(isMatchRecord);
    } catch {
      return [];
    }
  }

  /** Returns `false` if the match could not be saved. Adding the same match twice is harmless. */
  add(record: MatchRecord): boolean {
    const records = this.list();
    if (records.some((saved) => saved.id === record.id)) return true;
    return this.write([...records, record]);
  }

  /** Returns `false` if the history could not be deleted. */
  clear(): boolean {
    if (!this.storage) return false;
    try {
      this.storage.removeItem(HISTORY_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  /** A backup file's text. It can be imported again later, here or in another browser. */
  exportJson(): string {
    const document = { app: EXPORT_APP_NAME, version: RECORD_VERSION, matches: this.list() };
    return JSON.stringify(document, null, 2);
  }

  /** Merges a backup into the saved history. Matches that are already saved are skipped. */
  importJson(text: string): ImportSummary {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HistoryImportError("This file is not a RodinaRPS history backup.");
    }
    if (!isHistoryDocument(parsed)) {
      throw new HistoryImportError("This file is not a RodinaRPS history backup.");
    }
    if (parsed.version !== RECORD_VERSION) {
      throw new HistoryImportError("This backup was made by a different version and can't be imported.");
    }

    const existing = this.list();
    const knownIds = new Set(existing.map((record) => record.id));
    const incoming: MatchRecord[] = [];
    let duplicates = 0;
    let invalid = 0;

    for (const item of parsed.matches) {
      if (!isMatchRecord(item)) invalid += 1;
      else if (knownIds.has(item.id)) duplicates += 1;
      else {
        knownIds.add(item.id);
        incoming.push(item);
      }
    }

    if (incoming.length > 0 && !this.write([...existing, ...incoming])) {
      throw new HistoryImportError("Couldn't save the imported matches (browser storage is blocked or full).");
    }
    return { added: incoming.length, duplicates, invalid };
  }

  private write(records: readonly MatchRecord[]): boolean {
    if (!this.storage) return false;

    const chronological = [...records].sort(
      (first, second) => Date.parse(first.startedAt) - Date.parse(second.startedAt),
    );
    const document = { version: RECORD_VERSION, matches: chronological.slice(-MAX_STORED_MATCHES) };

    try {
      this.storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(document));
      return true;
    } catch {
      return false;
    }
  }
}
