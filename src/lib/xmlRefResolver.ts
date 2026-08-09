import type { XmlElementNode } from "./xmlParser.types";
import { findAttr, findChildElement, findChildElements, textContent } from "./xmlNodeHelpers";

export type RefKind = "fieldRef" | "navScreen" | "labelStyle" | "inputStyle";

export interface ResolvedRef {
  kind: RefKind;
  refValue: string;
  targetPageIndex: number;
  /** Anchor to scroll to on the target page. Absent for navScreen, which navigates
   * to the page itself rather than a specific element/style on it. */
  anchorId?: string;
}

export interface RefIndexes {
  /** anyType element's <Id> text -> the index of the page it lives on. Spans every
   * page, since a FieldRef can point at an element on a different page than itself. */
  elementIndex: Map<string, number>;
  /** Page's pageId attribute -> that page's index. */
  pageIndex: Map<string, number>;
  /** Style's <Name> text -> the index of the page its <Styles> block lives on. Spans
   * every page: <Styles> is structurally nested under one Page, but the fixture shows
   * other pages reference those same style names, so lookup isn't page-scoped. */
  styleIndex: Map<string, number>;
}

export function fieldAnchorId(idValue: string): string {
  return `field-ref-${idValue}`;
}

export function styleAnchorId(nameValue: string): string {
  return `style-ref-${nameValue}`;
}

export function buildElementIndex(pages: XmlElementNode[]): Map<string, number> {
  const index = new Map<string, number>();
  pages.forEach((page, pageIndex) => {
    const elementsContainer = findChildElement(page, "XmlElements");
    for (const el of findChildElements(elementsContainer, "anyType")) {
      const id = textContent(findChildElement(el, "Id"));
      if (id) index.set(id, pageIndex);
    }
  });
  return index;
}

export function buildPageIndex(pages: XmlElementNode[]): Map<string, number> {
  const index = new Map<string, number>();
  pages.forEach((page, pageIndex) => {
    const pageId = findAttr(page, "pageId");
    if (pageId) index.set(pageId, pageIndex);
  });
  return index;
}

export function buildStyleIndex(pages: XmlElementNode[]): Map<string, number> {
  const index = new Map<string, number>();
  pages.forEach((page, pageIndex) => {
    const stylesContainer = findChildElement(page, "Styles");
    for (const style of findChildElements(stylesContainer, "Style")) {
      const name = textContent(findChildElement(style, "Name"));
      if (name) index.set(name, pageIndex);
    }
  });
  return index;
}

/**
 * Recognizes exactly 4 reference tag names and resolves each against the supplied
 * indexes. Returns undefined both when `node` isn't one of these tags, and when it
 * is but nothing matches (a dangling reference) - both cases fall through to the
 * caller's default rendering, which is what makes an unresolved reference render
 * identically to an ordinary field.
 */
export function resolveReference(node: XmlElementNode, indexes: RefIndexes): ResolvedRef | undefined {
  switch (node.name) {
    case "FieldRef": {
      const elementId = findAttr(node, "elementId");
      const targetPageIndex = elementId ? indexes.elementIndex.get(elementId) : undefined;
      if (elementId === undefined || targetPageIndex === undefined) return undefined;
      return { kind: "fieldRef", refValue: elementId, targetPageIndex, anchorId: fieldAnchorId(elementId) };
    }
    case "NavScreen": {
      const pageId = textContent(node);
      const targetPageIndex = pageId ? indexes.pageIndex.get(pageId) : undefined;
      if (!pageId || targetPageIndex === undefined) return undefined;
      return { kind: "navScreen", refValue: pageId, targetPageIndex };
    }
    case "LabelStyle":
    case "InputStyle": {
      const name = textContent(node);
      const targetPageIndex = name ? indexes.styleIndex.get(name) : undefined;
      if (!name || targetPageIndex === undefined) return undefined;
      return {
        kind: node.name === "LabelStyle" ? "labelStyle" : "inputStyle",
        refValue: name,
        targetPageIndex,
        anchorId: styleAnchorId(name),
      };
    }
    default:
      return undefined;
  }
}
