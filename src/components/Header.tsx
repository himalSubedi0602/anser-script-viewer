import type { XmlElementNode } from "../lib/xmlParser.types";
import { findAttr, findChildElement, findChildElements, textContent } from "../lib/xmlNodeHelpers";
import { AttributeBadges } from "./AttributeBadges";
import { FieldGroup } from "./FieldGroup";
import styles from "./Header.module.css";

const CLIENT_SHOWN_ELSEWHERE = new Set(["Name"]);
const SCRIPT_SHOWN_ELSEWHERE = new Set(["Name", "Versions"]);
const VERSION_SHOWN_ELSEWHERE = new Set(["Pages"]);

export function Header({ root }: { root: XmlElementNode }) {
  const client = findChildElement(root, "Client");
  const script = findChildElement(root, "Script");
  const source = findChildElement(root, "Source");
  const developers = findChildElement(root, "Developers");
  const versions = findChildElement(script, "Versions");
  const versionList = findChildElements(versions, "Version");
  const activeVersionId = textContent(findChildElement(script, "ActiveVersionId"));

  return (
    <header className={styles.header}>
      <p className={styles.docLine}>
        <span className={styles.kicker}>Document</span>
        <AttributeBadges attributes={root.attributes} />
      </p>

      <div className={styles.row}>
        <div>
          <p className={styles.kicker}>Client</p>
          <h1>{textContent(findChildElement(client, "Name")) || "Untitled client"}</h1>
          <AttributeBadges attributes={client?.attributes ?? []} />
          {client && (
            <FieldGroup nodes={client.children.filter((c) => !(c.kind === "element" && CLIENT_SHOWN_ELSEWHERE.has(c.name)))} />
          )}
        </div>
        <div>
          <p className={styles.kicker}>Script</p>
          <h2>{textContent(findChildElement(script, "Name")) || "Untitled script"}</h2>
          <AttributeBadges attributes={script?.attributes ?? []} />
          {script && (
            <FieldGroup nodes={script.children.filter((c) => !(c.kind === "element" && SCRIPT_SHOWN_ELSEWHERE.has(c.name)))} />
          )}
        </div>
      </div>

      {versionList.length > 0 && (
        <section className={styles.versions}>
          <p className={styles.kicker}>Versions</p>
          {versionList.map((v, i) => (
            <div key={i} className={styles.versionRow}>
              <div className={styles.versionHeading}>
                <strong>
                  Version {findAttr(v, "versionNumber") ?? "?"}
                  {findAttr(v, "versionId") === activeVersionId ? " · active" : ""}
                </strong>
                <AttributeBadges attributes={v.attributes} />
              </div>
              <FieldGroup nodes={v.children.filter((c) => !(c.kind === "element" && VERSION_SHOWN_ELSEWHERE.has(c.name)))} />
            </div>
          ))}
        </section>
      )}

      <details className={styles.metadata}>
        <summary>Export metadata &amp; developers</summary>
        <div className={styles.metadataBody}>
          {source && (
            <div>
              <p className={styles.kicker}>Source</p>
              <FieldGroup nodes={source.children} />
            </div>
          )}
          {developers && (
            <div>
              <p className={styles.kicker}>Developers</p>
              <FieldGroup nodes={developers.children} />
            </div>
          )}
        </div>
      </details>
    </header>
  );
}
