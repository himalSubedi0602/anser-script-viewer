import { useRef, useState } from "react";
import type { ScriptSource } from "../hooks/useParsedScript";
import styles from "./SourcePicker.module.css";

type Tab = ScriptSource["kind"];

const TABS: { tab: Tab; label: string }[] = [
  { tab: "fixture", label: "Fixture" },
  { tab: "text", label: "Paste XML" },
  { tab: "file", label: "Upload file" },
];

export function SourcePicker({ mode, onSourceChange }: { mode: Tab; onSourceChange: (source: ScriptSource) => void }) {
  // Which tab is being looked at is independent of `mode` (the source currently
  // loaded) - switching tabs to peek at the paste box shouldn't discard a draft or
  // silently reload the fixture.
  const [activeTab, setActiveTab] = useState<Tab>(mode);
  const [draftXml, setDraftXml] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    if (tab === "fixture") onSourceChange({ kind: "fixture" });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSourceChange({ kind: "file", file });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist">
        {TABS.map(({ tab, label }) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? `${styles.tab} ${styles.activeTab}` : styles.tab}
            onClick={() => selectTab(tab)}
          >
            {label}
            {mode === tab && <span className={styles.activeDot} aria-label="currently loaded" />}
          </button>
        ))}
      </div>

      {activeTab === "text" && (
        <div className={styles.panel}>
          <textarea
            className={styles.textarea}
            placeholder="Paste XML here…"
            value={draftXml}
            onChange={(e) => setDraftXml(e.target.value)}
            rows={6}
          />
          <button type="button" className={styles.loadButton} disabled={!draftXml.trim()} onClick={() => onSourceChange({ kind: "text", xml: draftXml })}>
            Load XML
          </button>
        </div>
      )}

      {activeTab === "file" && (
        <div className={styles.panel}>
          <input ref={fileInputRef} type="file" accept=".xml,text/xml" onChange={handleFileChange} />
        </div>
      )}
    </div>
  );
}
