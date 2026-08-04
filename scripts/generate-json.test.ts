import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseXmlString } from "../src/lib/xmlParser.ts";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/script.xml", import.meta.url));
const COMMITTED_JSON_PATH = fileURLToPath(new URL("../data/script.json", import.meta.url));

describe("data/script.json freshness", () => {
  it("matches a fresh parse of the fixture - run `npm run generate:json` if this fails", () => {
    const freshTree = parseXmlString(readFileSync(FIXTURE_PATH, "utf-8"));
    const committedTree = JSON.parse(readFileSync(COMMITTED_JSON_PATH, "utf-8"));

    expect(committedTree).toEqual(freshTree);
  });
});
