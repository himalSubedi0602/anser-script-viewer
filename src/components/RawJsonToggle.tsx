import { useState } from "react";
import type { XmlNode } from "../lib/xmlParser.types";
import styles from "./RawJsonToggle.module.css";

export function RawJsonToggle({ node }: { node: XmlNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide raw JSON" : "View raw JSON"}
      </button>
      {open && <pre className={styles.json}>{JSON.stringify(node, null, 2)}</pre>}
    </div>
  );
}
