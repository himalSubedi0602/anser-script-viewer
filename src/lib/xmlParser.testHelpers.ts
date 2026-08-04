import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { XmlElementNode, XmlNode } from "./xmlParser.types";

export const FIXTURE_PATH = fileURLToPath(new URL("../../fixtures/script.xml", import.meta.url));

export function readFixtureXml(): string {
  return readFileSync(FIXTURE_PATH, "utf-8");
}

export function asElement(node: XmlNode): XmlElementNode {
  if (node.kind !== "element") throw new Error("expected node to be an element");
  return node;
}

export function elementChildren(node: XmlElementNode): XmlElementNode[] {
  return node.children.filter((c): c is XmlElementNode => c.kind === "element");
}
