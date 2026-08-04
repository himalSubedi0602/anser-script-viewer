import { DOMParser, Node } from "@xmldom/xmldom";
import type { Attr, Document, Element } from "@xmldom/xmldom";
import type { XmlAttribute, XmlNode } from "./xmlParser.types.ts";
import { XmlParseError } from "./xmlParser.types.ts";

const XML_MIME_TYPE = "application/xml";

/**
 * Parses an XML string into a generic XmlNode tree, rooted at the document's root element.
 * Walks by DOM node type only - never by tag/attribute name - so unfamiliar elements and
 * attributes survive without any change to this function.
 */
export function parseXmlString(xmlText: string): XmlNode {
  const issues: { level: string; message: string }[] = [];

  const parser = new DOMParser({
    onError: (level, message) => {
      issues.push({ level, message });
    },
  });

  let doc: Document;
  try {
    doc = parser.parseFromString(xmlText, XML_MIME_TYPE);
  } catch (cause) {
    throw new XmlParseError(cause instanceof Error ? cause.message : String(cause));
  }

  const blocking = issues[0];
  if (blocking) {
    throw new XmlParseError(`${blocking.level}: ${blocking.message}`);
  }

  const root = doc.documentElement;
  if (!root) {
    throw new XmlParseError("XML document has no root element");
  }

  return convertElement(root);
}

function convertElement(el: Element): XmlNode {
  const attributes: XmlAttribute[] = [];
  for (const attr of el.attributes) {
    attributes.push(convertAttribute(attr));
  }

  const children: XmlNode[] = [];
  for (const child of el.childNodes) {
    const converted = convertNode(child);
    if (converted) children.push(converted);
  }

  return {
    kind: "element",
    name: el.nodeName,
    namespacePrefix: el.prefix ?? undefined,
    namespaceURI: el.namespaceURI ?? undefined,
    attributes,
    children,
  };
}

function convertAttribute(attr: Attr): XmlAttribute {
  return {
    name: attr.name,
    namespacePrefix: attr.prefix ?? undefined,
    namespaceURI: attr.namespaceURI ?? undefined,
    value: attr.value,
  };
}

function convertNode(node: Node): XmlNode | null {
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      return convertElement(node as Element);
    case Node.TEXT_NODE:
      return { kind: "text", value: node.nodeValue ?? "" };
    case Node.CDATA_SECTION_NODE:
      return { kind: "cdata", value: node.nodeValue ?? "" };
    case Node.COMMENT_NODE:
      return { kind: "comment", value: node.nodeValue ?? "" };
    default:
      throw new XmlParseError(
        `Unsupported XML node type encountered (nodeType=${node.nodeType}, nodeName=${node.nodeName}). ` +
          "This parser models element, text, comment, and CDATA nodes only.",
      );
  }
}
