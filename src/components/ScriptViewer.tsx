import { useEffect, useMemo, useState } from "react";
import type { XmlElementNode } from "../lib/xmlParser.types";
import { findAttr, findChildElement, findChildElements, textContent } from "../lib/xmlNodeHelpers";
import { buildElementIndex, buildPageIndex, buildStyleIndex, type ResolvedRef } from "../lib/xmlRefResolver";
import { Header } from "./Header";
import { PageNav } from "./PageNav";
import { PageContent } from "./PageContent";
import { FieldGroup } from "./FieldGroup";
import { RefResolutionProvider } from "./RefResolutionContext";
import styles from "./ScriptViewer.module.css";

const HIGHLIGHT_DURATION_MS = 1600;

// Known top-level root children, used only to decide layout (which section goes
// where). Anything else - a future sibling of Client/Script/etc. - still renders,
// in "Other root-level fields" below, via the same generic FieldGroup as everything
// else. This is what keeps the layout choice from becoming an allowlist.
const KNOWN_ROOT_NAMES = new Set(["Source", "Developers", "Client", "Script"]);

export function ScriptViewer({ root }: { root: XmlElementNode }) {
  const script = findChildElement(root, "Script");
  const versions = findChildElement(script, "Versions");
  const versionList = findChildElements(versions, "Version");
  const activeVersionId = textContent(findChildElement(script, "ActiveVersionId"));

  const activeVersion = versionList.find((v) => findAttr(v, "versionId") === activeVersionId) ?? versionList[0];
  const pagesContainer = findChildElement(activeVersion, "Pages");
  const pages = findChildElements(pagesContainer, "Page");

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPage = pages[selectedIndex];

  const otherRootChildren = root.children.filter((c) => !(c.kind === "element" && KNOWN_ROOT_NAMES.has(c.name)));
  const hasOtherRootFields = otherRootChildren.some((c) => c.kind === "element" || (c.kind === "text" && c.value.trim() !== ""));

  // Built once per `pages` identity (i.e. per loaded document), not per render or
  // per page switch - a FieldRef/style reference can point at a different page than
  // the one it's viewed from, so these all span the whole document, not just the
  // currently-selected page. See xmlRefResolver.ts for why.
  const indexes = useMemo(
    () => ({
      elementIndex: buildElementIndex(pages),
      pageIndex: buildPageIndex(pages),
      styleIndex: buildStyleIndex(pages),
    }),
    [pages],
  );

  const [highlightedAnchorId, setHighlightedAnchorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!highlightedAnchorId) return;
    const timer = setTimeout(() => setHighlightedAnchorId(undefined), HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [highlightedAnchorId]);

  function onActivateRef(ref: ResolvedRef) {
    if (ref.kind === "navScreen") {
      setSelectedIndex(ref.targetPageIndex);
      return;
    }
    if (ref.targetPageIndex !== selectedIndex) setSelectedIndex(ref.targetPageIndex);
    setHighlightedAnchorId(ref.anchorId);
  }

  return (
    <div className={styles.layout}>
      <Header root={root} />
      <div className={styles.body}>
        <PageNav pages={pages} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <main className={styles.main}>
          {selectedPage ? (
            <RefResolutionProvider value={{ indexes, highlightedAnchorId, onActivateRef }}>
              <PageContent page={selectedPage} />
            </RefResolutionProvider>
          ) : (
            <p>No pages found in the active version.</p>
          )}
        </main>
      </div>
      {hasOtherRootFields && (
        <section className={styles.otherFields}>
          <h3>Other root-level fields</h3>
          <FieldGroup nodes={otherRootChildren} />
        </section>
      )}
    </div>
  );
}
