import type { XmlElementNode, XmlNode } from "./xmlParser.types";

// These are UI-layout convenience helpers only, used to find well-known top-level
// sections (Client, Script, Pages...) for organizing the page. The parser itself
// (xmlParser.ts) never uses name-based lookups like this - it stays fully generic.
// Field-level rendering (FieldGroup) is also name-agnostic; only layout uses these.

export function findChildElement(node: XmlElementNode | undefined, name: string): XmlElementNode | undefined {
  if (!node) return undefined;
  return node.children.find((c): c is XmlElementNode => c.kind === "element" && c.name === name);
}

export function findChildElements(node: XmlElementNode | undefined, name: string): XmlElementNode[] {
  if (!node) return [];
  return node.children.filter((c): c is XmlElementNode => c.kind === "element" && c.name === name);
}

export function findAttr(node: XmlElementNode | undefined, name: string): string | undefined {
  return node?.attributes.find((a) => a.name === name)?.value;
}

export function textContent(node: XmlElementNode | undefined): string {
  if (!node) return "";
  return node.children
    .filter((c): c is Extract<XmlNode, { kind: "text" }> => c.kind === "text")
    .map((c) => c.value)
    .join("")
    .trim();
}
