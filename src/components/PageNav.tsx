import type { XmlElementNode } from "../lib/xmlParser.types";
import { findChildElement, textContent } from "../lib/xmlNodeHelpers";
import styles from "./PageNav.module.css";

export function PageNav({
  pages,
  selectedIndex,
  onSelect,
}: {
  pages: XmlElementNode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className={styles.nav}>
      <h3>Pages</h3>
      <ol className={styles.list}>
        {pages.map((page, i) => {
          const name = findChildElement(page, "Name");
          return (
            <li key={i}>
              <button
                type="button"
                className={i === selectedIndex ? styles.activeItem : styles.item}
                onClick={() => onSelect(i)}
              >
                {textContent(name) || page.name}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
