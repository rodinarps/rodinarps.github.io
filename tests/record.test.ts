import { describe, expect, it } from "vitest";
import { Match } from "../src/core/match";
import {
  createMatchRecord,
  decodeRounds,
  encodeRounds,
  generateMatchId,
  isMatchRecord,
  recordVerdict,
} from "../src/core/record";
import type { MatchRecord } from "../src/core/types";

const validRecord: MatchRecord = {
  version: 1,
  id: "abc-123",
  startedAt: "2026-11-18T12:00:00.000Z",
  mode: "rounds",
  setting: 3,
  playerScore: 1,
  cpuScore: 0,
  rounds: "prrrpp",
};

describe("encodeRounds / decodeRounds", () => {
  it("round-trips rounds as two letters each", () => {
    const rounds = [
      { playerChoice: "rock", cpuChoice: "scissors" },
      { playerChoice: "paper", cpuChoice: "paper" },
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
    const match = new Match("rounds", 2, startedAt);
    match.playRound("paper", () => 0); // computer picks rock: player wins
    match.playRound("rock", () => 0); // rock vs rock: tie

    const record = createMatchRecord(match, "fixed-id");
    expect(record).toEqual({
      version: 1,
      id: "fixed-id",
      startedAt: "2026-11-18T12:00:00.000Z",
      mode: "rounds",
      setting: 2,
      playerScore: 1,
      cpuScore: 0,
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
    ["another version", { ...validRecord, version: 2 }],
    ["an empty id", { ...validRecord, id: "" }],
    ["a very long id", { ...validRecord, id: "x".repeat(65) }],
    ["a bad date", { ...validRecord, startedAt: "yesterday-ish" }],
    ["an unknown mode", { ...validRecord, mode: "endless" }],
    ["a zero setting", { ...validRecord, setting: 0 }],
    ["a negative score", { ...validRecord, playerScore: -1 }],
    ["a fractional score", { ...validRecord, cpuScore: 1.5 }],
    ["rounds with unknown letters", { ...validRecord, rounds: "prxz" }],
    ["rounds with an odd length", { ...validRecord, rounds: "prr" }],
    ["a missing field", { ...validRecord, rounds: undefined }],
  ])("rejects %s", (_label, value) => {
    expect(isMatchRecord(value)).toBe(false);
  });
});
