import { describe, expect, it } from "vitest";
import { parseXmlString } from "./xmlParser";
import { asElement, elementChildren, readFixtureXml } from "./xmlParser.testHelpers";
import { findChildElement, findChildElements } from "./xmlNodeHelpers";
import {
  buildElementIndex,
  buildPageIndex,
  buildStyleIndex,
  fieldAnchorId,
  resolveReference,
  styleAnchorId,
} from "./xmlRefResolver";
import type { XmlElementNode } from "./xmlParser.types";

function loadPages(): XmlElementNode[] {
  const root = asElement(parseXmlString(readFixtureXml()));
  const script = findChildElement(root, "Script")!;
  const versions = findChildElement(script, "Versions")!;
  const version = findChildElement(versions, "Version")!;
  const pagesContainer = findChildElement(version, "Pages")!;
  return findChildElements(pagesContainer, "Page");
}

function findAnyType(pages: XmlElementNode[], id: string): XmlElementNode {
  for (const page of pages) {
    const container = findChildElement(page, "XmlElements");
    for (const el of findChildElements(container, "anyType")) {
      if (findChildElement(el, "Id")?.children.some((c) => c.kind === "text" && c.value.trim() === id)) return el;
    }
  }
  throw new Error(`no anyType with Id ${id} found`);
}

function findLeaf(el: XmlElementNode, tagName: string): XmlElementNode {
  const found = elementChildren(el)
    .flatMap((c) => [c, ...elementChildren(c)])
    .find((c) => c.name === tagName);
  if (!found) throw new Error(`no ${tagName} found under ${el.name}`);
  return found;
}

describe("xmlRefResolver - index building", () => {
  const pages = loadPages();

  it("buildElementIndex maps every anyType's Id to its page index, across all pages", () => {
    const index = buildElementIndex(pages);
    expect(index.get("training-caller-name")).toBe(0);
    expect(index.get("training-call-reason")).toBe(1);
    expect(index.get("training-disposition")).toBe(2);
    expect(index.size).toBe(10); // 3 + 4 + 3 anyType elements across the three pages
  });

  it("buildPageIndex maps every Page's pageId to its own index", () => {
    const index = buildPageIndex(pages);
    expect(index.get("training-page-caller-information")).toBe(0);
    expect(index.get("training-page-call-reason")).toBe(1);
    expect(index.get("training-page-confirm-close")).toBe(2);
  });

  it("buildStyleIndex maps Style names to the page their <Styles> block lives on, across all pages", () => {
    const index = buildStyleIndex(pages);
    expect(index.get("StandardInput")).toBe(0);
    expect(index.size).toBe(1); // the fixture defines exactly one Style, anywhere
  });
});

describe("xmlRefResolver - resolveReference against the real fixture", () => {
  const pages = loadPages();
  const indexes = { elementIndex: buildElementIndex(pages), pageIndex: buildPageIndex(pages), styleIndex: buildStyleIndex(pages) };

  it("resolves a cross-page FieldRef (page 3 -> page 1)", () => {
    const confirmationReadback = findAnyType(pages, "training-confirmation-readback");
    const templateFields = findChildElement(confirmationReadback, "TemplateFields");
    const fieldRef = findChildElements(templateFields, "FieldRef").find(
      (r) => r.attributes.find((a) => a.name === "elementId")?.value === "training-caller-name",
    )!;

    const resolved = resolveReference(fieldRef, indexes);
    expect(resolved).toEqual({
      kind: "fieldRef",
      refValue: "training-caller-name",
      targetPageIndex: 0,
      anchorId: fieldAnchorId("training-caller-name"),
    });
  });

  it("resolves a NavScreen to its target page", () => {
    const callbackNumber = findAnyType(pages, "training-callback-number");
    const navScreen = findLeaf(callbackNumber, "NavScreen");

    const resolved = resolveReference(navScreen, indexes);
    expect(resolved).toEqual({ kind: "navScreen", refValue: "training-page-call-reason", targetPageIndex: 1 });
  });

  it("resolves an InputStyle that matches a real Style definition", () => {
    const callerName = findAnyType(pages, "training-caller-name");
    const inputStyle = findLeaf(callerName, "InputStyle");

    const resolved = resolveReference(inputStyle, indexes);
    expect(resolved).toEqual({
      kind: "inputStyle",
      refValue: "StandardInput",
      targetPageIndex: 0,
      anchorId: styleAnchorId("StandardInput"),
    });
  });

  it("resolves a same-name style reference from a different page than the one that defines it", () => {
    const callReason = findAnyType(pages, "training-call-reason"); // lives on page 2 (index 1)
    const inputStyle = findLeaf(callReason, "InputStyle");
    expect(inputStyle.children.some((c) => c.kind === "text" && c.value.trim() === "StandardInput")).toBe(true);

    const resolved = resolveReference(inputStyle, indexes);
    expect(resolved?.targetPageIndex).toBe(0); // resolves to page 1, where the Style is actually defined
  });

  it("leaves a dangling LabelStyle reference (StandardLabel is never defined) unresolved", () => {
    const callerName = findAnyType(pages, "training-caller-name");
    const labelStyle = findLeaf(callerName, "LabelStyle");
    expect(labelStyle.children.some((c) => c.kind === "text" && c.value.trim() === "StandardLabel")).toBe(true);

    expect(resolveReference(labelStyle, indexes)).toBeUndefined();
  });

  it("leaves a dangling InputStyle reference (PhoneInput is never defined) unresolved", () => {
    const callbackNumber = findAnyType(pages, "training-callback-number");
    const inputStyle = findLeaf(callbackNumber, "InputStyle");
    expect(inputStyle.children.some((c) => c.kind === "text" && c.value.trim() === "PhoneInput")).toBe(true);

    expect(resolveReference(inputStyle, indexes)).toBeUndefined();
  });

  it("does not recognize an ordinary, non-reference field", () => {
    const callerName = findAnyType(pages, "training-caller-name");
    const tag = findLeaf(callerName, "Tag");

    expect(resolveReference(tag, indexes)).toBeUndefined();
  });

  it("leaves a synthetic FieldRef pointing at a nonexistent id unresolved", () => {
    const syntheticFieldRef: XmlElementNode = {
      kind: "element",
      name: "FieldRef",
      attributes: [{ name: "elementId", value: "does-not-exist-anywhere", namespacePrefix: undefined, namespaceURI: undefined }],
      children: [],
    };

    expect(resolveReference(syntheticFieldRef, indexes)).toBeUndefined();
  });
});
