import type { XmlElementNode } from "../lib/xmlParser.types";
import { findAttr } from "../lib/xmlNodeHelpers";
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

  return (
    <details className={styles.card} open>
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
