import { useState } from "react";
import type { XmlElementNode } from "../lib/xmlParser.types";
import { elementToCleanJson } from "../lib/xmlNodeToCleanJson";
import styles from "./RawJsonToggle.module.css";

export function RawJsonToggle({ node }: { node: XmlElementNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide JSON" : "View JSON"}
      </button>
      {open && <pre className={styles.json}>{JSON.stringify(elementToCleanJson(node), null, 2)}</pre>}
    </div>
  );
}
