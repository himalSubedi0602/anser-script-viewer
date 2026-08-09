import { useEffect, useRef } from "react";
import type { XmlElementNode } from "../lib/xmlParser.types";
import { findChildElement, textContent } from "../lib/xmlNodeHelpers";
import { styleAnchorId } from "../lib/xmlRefResolver";
import { useRefResolution } from "./RefResolutionContext";
import { FieldGroup } from "./FieldGroup";
import styles from "./StyleCard.module.css";

/**
 * Renders one <Style> definition. Styles get their own anchor id (derived from their
 * <Name>) so a LabelStyle/InputStyle reference elsewhere in the document can scroll
 * to and highlight the definition it resolved to - the same mechanism ElementCard
 * uses for FieldRef targets.
 */
export function StyleCard({ style }: { style: XmlElementNode }) {
  const name = textContent(findChildElement(style, "Name"));
  const anchorId = name ? styleAnchorId(name) : undefined;

  const ref = useRefResolution();
  const isHighlighted = anchorId !== undefined && ref?.highlightedAnchorId === anchorId;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isHighlighted]);

  return (
    <div ref={cardRef} id={anchorId} className={isHighlighted ? `${styles.card} ${styles.highlighted}` : styles.card}>
      <div className={styles.name}>{name || style.name}</div>
      <FieldGroup nodes={style.children} />
    </div>
  );
}
