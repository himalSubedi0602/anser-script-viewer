import type { XmlElementNode, XmlNode } from "../lib/xmlParser.types";
import { resolveReference } from "../lib/xmlRefResolver";
import { useRefResolution } from "./RefResolutionContext";
import { AttributeBadges } from "./AttributeBadges";
import { ReferenceRow } from "./ReferenceRow";
import styles from "./FieldGroup.module.css";

function isDisplayable(node: XmlNode): boolean {
  // Whitespace-only text nodes are source-formatting artifacts, not information -
  // skip them in the display only. Nothing is removed from the underlying data.
  return !(node.kind === "text" && node.value.trim() === "");
}

function ElementRow({ node }: { node: XmlElementNode }) {
  // The one deliberate, documented exception to "never branch on a name" - see
  // AGENTS.md. All name-awareness lives in resolveReference(); this component only
  // reacts to its result. Undefined covers both "not a reference tag" and "a
  // reference tag with no match" (a dangling reference), so both fall straight
  // through to the ordinary shape-based rendering below with no other change needed.
  const refResolution = useRefResolution();
  const resolved = refResolution && resolveReference(node, refResolution.indexes);
  if (resolved) {
    return <ReferenceRow node={node} resolved={resolved} onActivate={() => refResolution.onActivateRef(resolved)} />;
  }

  const visibleChildren = node.children.filter(isDisplayable);
  const childElements = visibleChildren.filter((c) => c.kind === "element");

  // No child elements -> this is a leaf field (possibly with text and/or
  // attributes). Render as a single compact row rather than a nested box.
  if (childElements.length === 0) {
    const text = visibleChildren
      .map((c) => (c.kind === "text" || c.kind === "cdata" ? c.value : c.kind === "comment" ? `(comment: ${c.value})` : ""))
      .join("")
      .trim();

    return (
      <div className={styles.leafRow}>
        <span className={styles.label}>{node.name}</span>
        <AttributeBadges attributes={node.attributes} />
        {text && <span className={styles.value}>{text}</span>}
        {!text && node.attributes.length === 0 && <span className={styles.empty}>(empty)</span>}
      </div>
    );
  }

  // Has child elements -> nested structure. Render as a labeled section and recurse.
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.label}>{node.name}</span>
        <AttributeBadges attributes={node.attributes} />
      </div>
      <FieldGroup nodes={visibleChildren} />
    </div>
  );
}

/**
 * Renders a list of sibling XmlNodes generically, driven only by each node's shape
 * (does it have child elements? is it plain text?) - never by its name. This is what
 * lets Requirements, Modes, Styles, and any unfamiliar field (e.g. FutureVendorSetting)
 * all render correctly through the same code path, with no per-field special-casing.
 */
export function FieldGroup({ nodes }: { nodes: XmlNode[] }) {
  const visible = nodes.filter(isDisplayable);

  if (visible.length === 0) {
    return <p className={styles.empty}>(no fields)</p>;
  }

  return (
    <div className={styles.group}>
      {visible.map((node, i) => {
        if (node.kind === "element") return <ElementRow key={i} node={node} />;
        if (node.kind === "comment") return <p key={i} className={styles.commentNode}>{node.value}</p>;
        return (
          <p key={i} className={styles.textNode}>
            {node.value}
          </p>
        );
      })}
    </div>
  );
}
