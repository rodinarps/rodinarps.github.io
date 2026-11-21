import { describe, expect, it } from "vitest";
import { Match } from "../src/core/match";
import {
  createMatchRecord,
  decodeRounds,
  encodeRounds,
  generateMatchId,
  isMatchRecord,
  recordVerdict,
  upgradeRecord,
} from "../src/core/record";
import type { MatchRecord } from "../src/core/types";

const validRecord: MatchRecord = {
  version: 2,
  id: "abc-123",
  startedAt: "2026-11-18T12:00:00.000Z",
  mode: "rounds",
  setting: 3,
  difficulty: "hard",
  playerScore: 1,
  aiScore: 0,
  rounds: "prrrpp",
};

/** What was saved before difficulty levels existed (and before "CPU" became "AI"). */
const legacyRecord = {
  version: 1,
  id: "old-1",
  startedAt: "2026-11-17T09:30:00.000Z",
  mode: "time",
  setting: 10,
  playerScore: 4,
  cpuScore: 6,
  rounds: "rsprpp",
};

describe("encodeRounds / decodeRounds", () => {
  it("round-trips rounds as two letters each", () => {
    const rounds = [
      { playerChoice: "rock", aiChoice: "scissors" },
      { playerChoice: "paper", aiChoice: "paper" },
    ] as const;
    expect(encodeRounds(rounds)).toBe("rspp");
    expect(decodeRounds("rspp")).toEqual(rounds);
  });

  it("ignores a dangling letter or unknown letters", () => {
    expect(decodeRounds("rsp")).toHaveLength(1);
    expect(decodeRounds("xx")).toHaveLength(0);
  });
});

describe("createMatchRecord", () => {
  it("summarises a finished match", () => {
    const startedAt = new Date("2026-11-18T12:00:00.000Z");
    const match = new Match("rounds", 2, "extreme", startedAt);
    match.playRound("paper", () => 0); // computer picks rock: player wins
    match.playRound("rock", () => 0); // rock vs rock: tie

    const record = createMatchRecord(match, "fixed-id");
    expect(record).toEqual({
      version: 2,
      id: "fixed-id",
      startedAt: "2026-11-18T12:00:00.000Z",
      mode: "rounds",
      setting: 2,
      difficulty: "extreme",
      playerScore: 1,
      aiScore: 0,
      rounds: "prrr",
    });
    expect(isMatchRecord(record)).toBe(true);
    expect(recordVerdict(record)).toBe("win");
  });

  it("makes a different id each time", () => {
    expect(generateMatchId()).not.toBe(generateMatchId());
  });
});

describe("isMatchRecord", () => {
  it("accepts a valid record", () => {
    expect(isMatchRecord(validRecord)).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "record"],
    ["the old version (it needs upgrading first)", legacyRecord],
    ["a future version", { ...validRecord, version: 3 }],
    ["an empty id", { ...validRecord, id: "" }],
    ["a very long id", { ...validRecord, id: "x".repeat(65) }],
    ["a bad date", { ...validRecord, startedAt: "yesterday-ish" }],
    ["an unknown mode", { ...validRecord, mode: "endless" }],
    ["a zero setting", { ...validRecord, setting: 0 }],
    ["a negative score", { ...validRecord, playerScore: -1 }],
    ["a fractional score", { ...validRecord, aiScore: 1.5 }],
    ["a missing difficulty", { ...validRecord, difficulty: undefined }],
    ["an unknown difficulty", { ...validRecord, difficulty: "nightmare" }],
    ["rounds with unknown letters", { ...validRecord, rounds: "prxz" }],
    ["rounds with an odd length", { ...validRecord, rounds: "prr" }],
    ["a missing field", { ...validRecord, rounds: undefined }],
  ])("rejects %s", (_label, value) => {
    expect(isMatchRecord(value)).toBe(false);
  });
});

describe("upgradeRecord", () => {
  it("keeps a current record as it is", () => {
    expect(upgradeRecord(validRecord)).toEqual(validRecord);
  });

  it("upgrades an old record: CPU becomes AI, and it counts as medium", () => {
    expect(upgradeRecord(legacyRecord)).toEqual({
      version: 2,
      id: "old-1",
      startedAt: "2026-11-17T09:30:00.000Z",
      mode: "time",
      setting: 10,
      difficulty: "medium",
      playerScore: 4,
      aiScore: 6,
      rounds: "rsprpp",
    });
  });

  it("rejects damaged records of either version", () => {
    expect(upgradeRecord({ ...legacyRecord, cpuScore: -1 })).toBeNull();
    expect(upgradeRecord({ ...legacyRecord, rounds: "xx" })).toBeNull();
    expect(upgradeRecord({ ...validRecord, difficulty: "nightmare" })).toBeNull();
    expect(upgradeRecord(null)).toBeNull();
    expect(upgradeRecord("record")).toBeNull();
  });
});
