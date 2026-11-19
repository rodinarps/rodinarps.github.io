import type { Match } from "./match";
import { verdictFromScores } from "./rules";
import type { Choice, MatchRecord, RoundResult } from "./types";

export const RECORD_VERSION = 1;

const MAX_ID_LENGTH = 64;
/** 25,000 rounds: far more than a real match, but keeps imported files from being absurdly big. */
const MAX_ROUNDS_CHARS = 50_000;
const ROUNDS_PATTERN = /^(?:[rps]{2})*$/;

const CODE_BY_CHOICE: Record<Choice, string> = { rock: "r", paper: "p", scissors: "s" };
const CHOICE_BY_CODE: Record<string, Choice | undefined> = { r: "rock", p: "paper", s: "scissors" };

export interface RoundPair {
  readonly playerChoice: Choice;
  readonly cpuChoice: Choice;
}

/** [rock vs scissors, paper vs paper] -> "rspp" */
export function encodeRounds(rounds: readonly RoundPair[]): string {
  return rounds
    .map(({ playerChoice, cpuChoice }) => CODE_BY_CHOICE[playerChoice] + CODE_BY_CHOICE[cpuChoice])
    .join("");
}

/** Inverse of `encodeRounds`. Ignores anything that is not a valid pair. */
export function decodeRounds(encoded: string): RoundPair[] {
  const pairs: RoundPair[] = [];
  for (let index = 0; index + 1 < encoded.length; index += 2) {
    const playerChoice = CHOICE_BY_CODE[encoded.charAt(index)];
    const cpuChoice = CHOICE_BY_CODE[encoded.charAt(index + 1)];
    if (playerChoice && cpuChoice) pairs.push({ playerChoice, cpuChoice });
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
    playerScore: match.playerScore,
    cpuScore: match.cpuScore,
    rounds: encodeRounds(match.rounds),
  };
}

export function recordVerdict(record: Pick<MatchRecord, "playerScore" | "cpuScore">): RoundResult {
  return verdictFromScores(record.playerScore, record.cpuScore);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Runtime check for data read from storage or an imported file. TypeScript types
 * only exist at build time, and saved data can be old, damaged or edited by hand.
 */
export function isMatchRecord(value: unknown): value is MatchRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    record.version === RECORD_VERSION &&
    typeof record.id === "string" &&
    record.id.length > 0 &&
    record.id.length <= MAX_ID_LENGTH &&
    typeof record.startedAt === "string" &&
    !Number.isNaN(Date.parse(record.startedAt)) &&
    (record.mode === "time" || record.mode === "rounds") &&
    isNonNegativeInteger(record.setting) &&
    record.setting >= 1 &&
    isNonNegativeInteger(record.playerScore) &&
    isNonNegativeInteger(record.cpuScore) &&
    typeof record.rounds === "string" &&
    record.rounds.length <= MAX_ROUNDS_CHARS &&
    ROUNDS_PATTERN.test(record.rounds)
  );
}
