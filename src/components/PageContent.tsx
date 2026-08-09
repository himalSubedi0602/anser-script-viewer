import type { XmlElementNode } from "../lib/xmlParser.types";
import { findChildElement, findChildElements, textContent } from "../lib/xmlNodeHelpers";
import { AttributeBadges } from "./AttributeBadges";
import { ElementCard } from "./ElementCard";
import { StyleCard } from "./StyleCard";
import { FieldGroup } from "./FieldGroup";
import styles from "./PageContent.module.css";

const SHOWN_ELSEWHERE = new Set(["Name", "SummaryHeader", "XmlElements", "Styles"]);

export function PageContent({ page }: { page: XmlElementNode }) {
  const name = findChildElement(page, "Name");
  const summaryHeader = findChildElement(page, "SummaryHeader");
  const xmlElementsContainer = findChildElement(page, "XmlElements");
  const elements = xmlElementsContainer
    ? xmlElementsContainer.children.filter((c): c is XmlElementNode => c.kind === "element")
    : [];

  const stylesContainer = findChildElement(page, "Styles");
  const pageStyles = findChildElements(stylesContainer, "Style");

  // Everything else on the page (Styles, XmlNodes, CompletionAction, and anything
  // unfamiliar) renders generically here too - nothing on the page is dropped just
  // because it isn't "the elements list".
  const otherFields = page.children.filter((c) => !(c.kind === "element" && SHOWN_ELSEWHERE.has(c.name)));

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h2>{textContent(name) || page.name}</h2>
        <AttributeBadges attributes={page.attributes} />
      </div>
      {summaryHeader && <p className={styles.summaryHeader}>{textContent(summaryHeader)}</p>}

      <section>
        <h3>Elements ({elements.length})</h3>
        {elements.length === 0 && <p className={styles.muted}>No elements on this page.</p>}
        {elements.map((el, i) => (
          <ElementCard key={i} element={el} />
        ))}
      </section>

      {pageStyles.length > 0 && (
        <section>
          <h3>Styles ({pageStyles.length})</h3>
          {pageStyles.map((style, i) => (
            <StyleCard key={i} style={style} />
          ))}
        </section>
      )}

      <section>
        <h3>Page details</h3>
        <FieldGroup nodes={otherFields} />
      </section>
    </div>
  );
}
