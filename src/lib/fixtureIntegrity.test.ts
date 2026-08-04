import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FIXTURE_PATH } from "./xmlParser.testHelpers";

// Hardcoded independently of the private dev-log, per the fixture-protection rules -
// this is the source of truth for "has the supplied fixture been modified", not a
// value read from .local-notes/dev-log.md at runtime.
//
// If this test ever fails: the fixture was modified. Restore it - never update this
// hash to make the test pass.
const EXPECTED_SHA256 = "a3eea6393895db33f275560558d6f87b22581416218b0159e4329f26189fc895";

describe("fixtures/script.xml integrity", () => {
  it("has not been modified from its originally supplied content", () => {
    const rawBytes = readFileSync(FIXTURE_PATH);
    const actual = createHash("sha256").update(rawBytes).digest("hex");
    expect(actual).toBe(EXPECTED_SHA256);
  });
});
