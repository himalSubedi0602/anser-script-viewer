import { describe, expect, it } from "vitest";
import { parseXmlString } from "./xmlParser";
import type { XmlNode } from "./xmlParser.types";
import { readFixtureXml } from "./xmlParser.testHelpers";

// Test-only: serializes an XmlNode tree back to an XML string, purely to support the
// round-trip proof below. The app itself never needs to go JSON -> XML.
function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttributeValue(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function serializeXmlNode(node: XmlNode): string {
  switch (node.kind) {
    case "text":
      return escapeText(node.value);
    case "comment":
      return `<!--${node.value}-->`;
    case "cdata":
      return `<![CDATA[${node.value}]]>`;
    case "element": {
      const attrs = node.attributes.map((a) => ` ${a.name}="${escapeAttributeValue(a.value)}"`).join("");
      if (node.children.length === 0) {
        return `<${node.name}${attrs}/>`;
      }
      const inner = node.children.map(serializeXmlNode).join("");
      return `<${node.name}${attrs}>${inner}</${node.name}>`;
    }
  }
}

describe("parseXmlString - structural round-trip", () => {
  it("round-trips a synthetic snippet covering namespaces, comments, CDATA, and escaping", () => {
    const snippet = `<Root xmlns:ns="http://example.com/ns" plain="value" tricky="a &amp; b &lt;c&gt;">
  <ns:Item id="1"/>
  <!-- a note about <angles> and stuff -->
  <![CDATA[<raw> & untouched text]]>
  <ns:Item id="2">line with &amp; ampersand</ns:Item>
</Root>`;

    const firstParse = parseXmlString(snippet);
    const reserialized = serializeXmlNode(firstParse);
    const secondParse = parseXmlString(reserialized);

    expect(secondParse).toEqual(firstParse);
  });

  it("round-trips the entire real fixture without any loss", () => {
    const xml = readFixtureXml();

    const firstParse = parseXmlString(xml);
    const reserialized = serializeXmlNode(firstParse);
    const secondParse = parseXmlString(reserialized);

    expect(secondParse).toEqual(firstParse);
  });
});
