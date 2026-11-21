import { LEGACY_RECORD_VERSION, RECORD_VERSION, upgradeRecord } from "../core/record";
import type { MatchRecord } from "../core/types";
import type { StorageLike } from "./browserStorage";

/** Prefixed so other sites under the same github.io address never collide with these keys. */
export const HISTORY_STORAGE_KEY = "rodinarps:history";
/** Oldest matches are dropped beyond this, so the history can't grow forever. */
export const MAX_STORED_MATCHES = 500;
const EXPORT_APP_NAME = "RodinaRPS";
/** Data in these versions can be read. Older ones are upgraded to the current shape. */
const READABLE_VERSIONS: readonly number[] = [RECORD_VERSION, LEGACY_RECORD_VERSION];

export interface ImportSummary {
  readonly added: number;
  readonly duplicates: number;
  readonly invalid: number;
}

export type HistoryImportErrorCode = "invalid-file" | "unsupported-version" | "save-failed";

/** The chosen file isn't a RodinaRPS history export, or it couldn't be saved. The page words the message. */
export class HistoryImportError extends Error {
  constructor(readonly code: HistoryImportErrorCode) {
    super(code);
    this.name = "HistoryImportError";
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

function upgradeAll(items: readonly unknown[]): MatchRecord[] {
  return items.map(upgradeRecord).filter((record): record is MatchRecord => record !== null);
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

  /** Saved matches, oldest first. Damaged entries are skipped; older formats are upgraded. */
  list(): MatchRecord[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(HISTORY_STORAGE_KEY);
      if (raw === null) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!isHistoryDocument(parsed) || !READABLE_VERSIONS.includes(parsed.version)) return [];
      return upgradeAll(parsed.matches);
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

  /** Merges a backup (current or older format) into the saved history, skipping matches already saved. */
  importJson(text: string): ImportSummary {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HistoryImportError("invalid-file");
    }
    if (!isHistoryDocument(parsed)) throw new HistoryImportError("invalid-file");
    if (!READABLE_VERSIONS.includes(parsed.version)) throw new HistoryImportError("unsupported-version");

    const existing = this.list();
    const knownIds = new Set(existing.map((record) => record.id));
    const incoming: MatchRecord[] = [];
    let duplicates = 0;
    let invalid = 0;

    for (const item of parsed.matches) {
      const record = upgradeRecord(item);
      if (record === null) invalid += 1;
      else if (knownIds.has(record.id)) duplicates += 1;
      else {
        knownIds.add(record.id);
        incoming.push(record);
      }
    }

    if (incoming.length > 0 && !this.write([...existing, ...incoming])) {
      throw new HistoryImportError("save-failed");
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
