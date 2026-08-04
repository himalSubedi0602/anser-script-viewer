import { describe, expect, it } from "vitest";
import { parseXmlString } from "./xmlParser";
import type { XmlElementNode } from "./xmlParser.types";
import { asElement as asElementNode } from "./xmlParser.testHelpers";

function asElement(xml: string): XmlElementNode {
  return asElementNode(parseXmlString(xml));
}

describe("parseXmlString - elements and attributes", () => {
  it("parses a self-closing element with no children", () => {
    const root = asElement(`<Foo/>`);
    expect(root.name).toBe("Foo");
    expect(root.children).toEqual([]);
  });

  it("preserves attribute names, values, and source order", () => {
    const root = asElement(`<Foo b="2" a="1" c="3"/>`);
    expect(root.attributes).toEqual([
      { name: "b", value: "2", namespacePrefix: undefined, namespaceURI: undefined },
      { name: "a", value: "1", namespacePrefix: undefined, namespaceURI: undefined },
      { name: "c", value: "3", namespacePrefix: undefined, namespaceURI: undefined },
    ]);
  });

  it("preserves text content as a child node", () => {
    const root = asElement(`<Foo>Hello world</Foo>`);
    expect(root.children).toEqual([{ kind: "text", value: "Hello world" }]);
  });

  it("preserves parent-child relationships across nesting levels", () => {
    const root = asElement(`<A><B><C>deep</C></B></A>`);
    expect(root.name).toBe("A");
    const b = root.children[0];
    if (b.kind !== "element") throw new Error("expected B to be an element");
    expect(b.name).toBe("B");
    const c = b.children[0];
    if (c.kind !== "element") throw new Error("expected C to be an element");
    expect(c.name).toBe("C");
    expect(c.children).toEqual([{ kind: "text", value: "deep" }]);
  });
});

describe("parseXmlString - sibling order", () => {
  it("preserves sibling order, including repeated tag names", () => {
    const root = asElement(`<Root><Item id="1"/><Other/><Item id="2"/></Root>`);
    expect(root.children).toHaveLength(3);
    const names = root.children.map((c) => (c.kind === "element" ? c.name : c.kind));
    expect(names).toEqual(["Item", "Other", "Item"]);

    const first = root.children[0];
    const third = root.children[2];
    if (first.kind !== "element" || third.kind !== "element") {
      throw new Error("expected Item siblings to be elements");
    }
    expect(first.attributes).toEqual([
      { name: "id", value: "1", namespacePrefix: undefined, namespaceURI: undefined },
    ]);
    expect(third.attributes).toEqual([
      { name: "id", value: "2", namespacePrefix: undefined, namespaceURI: undefined },
    ]);
  });

  it("preserves mixed text and element sibling order", () => {
    const root = asElement(`<Root>before<Item/>after</Root>`);
    expect(root.children).toEqual([
      { kind: "text", value: "before" },
      { kind: "element", name: "Item", namespacePrefix: undefined, namespaceURI: undefined, attributes: [], children: [] },
      { kind: "text", value: "after" },
    ]);
  });
});

describe("parseXmlString - namespaces", () => {
  it("resolves a namespaced element's prefix and URI", () => {
    const root = asElement(
      `<Root xmlns:ns="http://example.com/ns"><ns:Item/></Root>`,
    );
    const item = root.children[0];
    if (item.kind !== "element") throw new Error("expected Item to be an element");
    expect(item.name).toBe("ns:Item");
    expect(item.namespacePrefix).toBe("ns");
    expect(item.namespaceURI).toBe("http://example.com/ns");
  });

  it("resolves a namespaced attribute's prefix and URI independently of its owning element", () => {
    const root = asElement(
      `<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Item xsi:type="AnyType" plain="value"/></Root>`,
    );
    const item = root.children[0];
    if (item.kind !== "element") throw new Error("expected Item to be an element");
    // Item itself has no namespace prefix - only the xsi:type *attribute* does.
    expect(item.namespacePrefix).toBeUndefined();
    expect(item.attributes).toEqual([
      {
        name: "xsi:type",
        value: "AnyType",
        namespacePrefix: "xsi",
        namespaceURI: "http://www.w3.org/2001/XMLSchema-instance",
      },
      { name: "plain", value: "value", namespacePrefix: undefined, namespaceURI: undefined },
    ]);
  });
});

describe("parseXmlString - comments and CDATA", () => {
  it("parses comment nodes and preserves their position among siblings", () => {
    const root = asElement(`<Root><A/><!-- a note --><B/></Root>`);
    expect(root.children).toEqual([
      { kind: "element", name: "A", namespacePrefix: undefined, namespaceURI: undefined, attributes: [], children: [] },
      { kind: "comment", value: " a note " },
      { kind: "element", name: "B", namespacePrefix: undefined, namespaceURI: undefined, attributes: [], children: [] },
    ]);
  });

  it("parses CDATA sections verbatim, without escaping", () => {
    const root = asElement(`<Root><![CDATA[<not a tag> & raw text]]></Root>`);
    expect(root.children).toEqual([{ kind: "cdata", value: "<not a tag> & raw text" }]);
  });
});
