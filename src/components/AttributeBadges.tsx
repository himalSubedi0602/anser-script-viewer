import type { XmlAttribute } from "../lib/xmlParser.types";
import styles from "./AttributeBadges.module.css";

export function AttributeBadges({ attributes }: { attributes: XmlAttribute[] }) {
  if (attributes.length === 0) return null;
  return (
    <span className={styles.attrs}>
      {attributes.map((a) => (
        <span key={a.name} className={styles.attrBadge}>
          {a.name}={JSON.stringify(a.value)}
        </span>
      ))}
    </span>
  );
}
