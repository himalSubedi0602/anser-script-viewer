import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseXmlString } from "../src/lib/xmlParser.ts";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/script.xml", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../data/script.json", import.meta.url));

const xml = readFileSync(FIXTURE_PATH, "utf-8");
const tree = parseXmlString(xml);

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(tree, null, 2) + "\n", "utf-8");

console.log(`Wrote ${OUTPUT_PATH}`);
