import { useEffect, useRef } from "react";
import type { XmlElementNode } from "../lib/xmlParser.types";
import { findAttr, findChildElement, textContent } from "../lib/xmlNodeHelpers";
import { fieldAnchorId } from "../lib/xmlRefResolver";
import { useRefResolution } from "./RefResolutionContext";
import { AttributeBadges } from "./AttributeBadges";
import { FieldGroup } from "./FieldGroup";
import { RawJsonToggle } from "./RawJsonToggle";
import styles from "./ElementCard.module.css";

/**
 * Renders one script element. In this schema the tag is always <anyType> and the
 * real kind lives in the xsi:type attribute - but this doesn't assume that. If
 * xsi:type is absent, it falls back to the element's actual tag name, so a
 * differently-shaped future element still gets a sensible label.
 */
export function ElementCard({ element }: { element: XmlElementNode }) {
  const xsiType = findAttr(element, "xsi:type");
  const typeLabel = xsiType ?? element.name;
  const otherAttrs = element.attributes.filter((a) => a.name !== "xsi:type");

  const id = textContent(findChildElement(element, "Id"));
  const anchorId = id ? fieldAnchorId(id) : undefined;

  const ref = useRefResolution();
  const isHighlighted = anchorId !== undefined && ref?.highlightedAnchorId === anchorId;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (isHighlighted) detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isHighlighted]);

  return (
    <details
      ref={detailsRef}
      id={anchorId}
      className={isHighlighted ? `${styles.card} ${styles.highlighted}` : styles.card}
      open
    >
      <summary className={styles.summary}>
        <span className={styles.typeBadge}>{typeLabel}</span>
        <AttributeBadges attributes={otherAttrs} />
      </summary>
      <div className={styles.body}>
        <FieldGroup nodes={element.children} />
        <RawJsonToggle node={element} />
      </div>
    </details>
  );
}
