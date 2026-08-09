import type { XmlElementNode, XmlNode } from "./xmlParser.types";

function textOf(node: XmlElementNode): string {
  return node.children
    .filter((c): c is Extract<XmlNode, { kind: "text" | "cdata" }> => c.kind === "text" || c.kind === "cdata")
    .map((c) => c.value)
    .join("")
    .trim();
}

/**
 * Converts one element's subtree into a compact, human-shaped JSON value - the same
 * information FieldGroup renders visually, not the raw parser AST. Whitespace-only
 * text nodes, parser-internal fields (kind, namespaceURI, ...), and empty leaves are
 * dropped; xsi:type becomes "type"; a repeated child tag becomes an array, a single
 * one becomes a plain value.
 */
export function elementToCleanJson(node: XmlElementNode): unknown {
  const childElements = node.children.filter((c): c is XmlElementNode => c.kind === "element");

  if (childElements.length === 0) {
    const text = textOf(node);
    if (node.attributes.length === 0) return text === "" ? undefined : text;

    const obj: Record<string, unknown> = {};
    for (const attr of node.attributes) obj[attr.name === "xsi:type" ? "type" : attr.name] = attr.value;
    if (text !== "") obj["#text"] = text;
    return obj;
  }

  const obj: Record<string, unknown> = {};
  for (const attr of node.attributes) obj[attr.name === "xsi:type" ? "type" : attr.name] = attr.value;

  const grouped = new Map<string, XmlElementNode[]>();
  for (const child of childElements) {
    const list = grouped.get(child.name) ?? [];
    list.push(child);
    grouped.set(child.name, list);
  }

  for (const [name, group] of grouped) {
    const values = group.map(elementToCleanJson).filter((v) => v !== undefined);
    if (values.length === 0) continue;
    obj[name] = group.length === 1 ? values[0] : values;
  }

  return obj;
}
