import { isDifficulty } from "./difficulty";
import type { Match } from "./match";
import { verdictFromScores } from "./rules";
import type { Choice, MatchRecord, RoundPair, RoundResult } from "./types";

export const RECORD_VERSION = 2;
/** The shape saved before difficulty levels existed. It is still understood and upgraded when read. */
export const LEGACY_RECORD_VERSION = 1;

const MAX_ID_LENGTH = 64;
/** 25,000 rounds: far more than a real match, but keeps imported files from being absurdly big. */
const MAX_ROUNDS_CHARS = 50_000;
const ROUNDS_PATTERN = /^(?:[rps]{2})*$/;

const CODE_BY_CHOICE: Record<Choice, string> = { rock: "r", paper: "p", scissors: "s" };
const CHOICE_BY_CODE: Record<string, Choice | undefined> = { r: "rock", p: "paper", s: "scissors" };

/** [rock vs scissors, paper vs paper] -> "rspp" */
export function encodeRounds(rounds: readonly RoundPair[]): string {
  return rounds
    .map(({ playerChoice, aiChoice }) => CODE_BY_CHOICE[playerChoice] + CODE_BY_CHOICE[aiChoice])
    .join("");
}

/** Inverse of `encodeRounds`. Ignores anything that is not a valid pair. */
export function decodeRounds(encoded: string): RoundPair[] {
  const pairs: RoundPair[] = [];
  for (let index = 0; index + 1 < encoded.length; index += 2) {
    const playerChoice = CHOICE_BY_CODE[encoded.charAt(index)];
    const aiChoice = CHOICE_BY_CODE[encoded.charAt(index + 1)];
    if (playerChoice && aiChoice) pairs.push({ playerChoice, aiChoice });
  }
  return pairs;
}

export function generateMatchId(): string {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (randomUuid) return randomUuid.call(globalThis.crypto);
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Turns a match into the record that gets saved. Call it once the match is finished. */
export function createMatchRecord(match: Match, id: string = generateMatchId()): MatchRecord {
  return {
    version: RECORD_VERSION,
    id,
    startedAt: match.startedAt.toISOString(),
    mode: match.mode,
    setting: match.setting,
    difficulty: match.difficulty,
    playerScore: match.playerScore,
    aiScore: match.aiScore,
    rounds: encodeRounds(match.rounds),
  };
}

export function recordVerdict(record: Pick<MatchRecord, "playerScore" | "aiScore">): RoundResult {
  return verdictFromScores(record.playerScore, record.aiScore);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** The checks that are the same in every version of the saved shape. */
function hasValidCommonFields(record: Record<string, unknown>): boolean {
  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    record.id.length <= MAX_ID_LENGTH &&
    typeof record.startedAt === "string" &&
    !Number.isNaN(Date.parse(record.startedAt)) &&
    (record.mode === "time" || record.mode === "rounds") &&
    isNonNegativeInteger(record.setting) &&
    record.setting >= 1 &&
    isNonNegativeInteger(record.playerScore) &&
    typeof record.rounds === "string" &&
    record.rounds.length <= MAX_ROUNDS_CHARS &&
    ROUNDS_PATTERN.test(record.rounds)
  );
}

/**
 * Runtime check for data read from storage or an imported file. TypeScript types
 * only exist at build time, and saved data can be old, damaged or edited by hand.
 */
export function isMatchRecord(value: unknown): value is MatchRecord {
  const record = asObject(value);
  return (
    record !== null &&
    record.version === RECORD_VERSION &&
    hasValidCommonFields(record) &&
    isDifficulty(record.difficulty) &&
    isNonNegativeInteger(record.aiScore)
  );
}

interface LegacyMatchRecord {
  readonly version: 1;
  readonly id: string;
  readonly startedAt: string;
  readonly mode: MatchRecord["mode"];
  readonly setting: number;
  readonly playerScore: number;
  readonly cpuScore: number;
  readonly rounds: string;
}

function isLegacyMatchRecord(value: unknown): value is LegacyMatchRecord {
  const record = asObject(value);
  return (
    record !== null &&
    record.version === LEGACY_RECORD_VERSION &&
    hasValidCommonFields(record) &&
    isNonNegativeInteger(record.cpuScore)
  );
}

/**
 * Accepts a current record, or one saved before difficulty levels existed (those matches
 * were played against the original algorithm, which is now "medium"). Anything else gives `null`.
 */
export function upgradeRecord(value: unknown): MatchRecord | null {
  if (isMatchRecord(value)) return value;
  if (!isLegacyMatchRecord(value)) return null;

  return {
    version: RECORD_VERSION,
    id: value.id,
    startedAt: value.startedAt,
    mode: value.mode,
    setting: value.setting,
    difficulty: "medium",
    playerScore: value.playerScore,
    aiScore: value.cpuScore,
    rounds: value.rounds,
  };
}
