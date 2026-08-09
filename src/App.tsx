import { useState } from "react";
import { useParsedScript } from "./hooks/useParsedScript";
import type { ScriptSource } from "./hooks/useParsedScript";
import { ScriptViewer } from "./components/ScriptViewer";
import { ErrorState } from "./components/ErrorState";
import { SourcePicker } from "./components/SourcePicker";
import styles from "./App.module.css";

function App() {
  const [source, setSource] = useState<ScriptSource>({ kind: "fixture" });
  // Bumped on every source change, and used as ScriptViewer's key, so switching
  // documents always starts from a clean ScriptViewer (fresh selected page) instead
  // of trying to reconcile old per-document state (e.g. selectedIndex) by hand.
  const [sourceVersion, setSourceVersion] = useState(0);

  function handleSourceChange(next: ScriptSource) {
    setSource(next);
    setSourceVersion((v) => v + 1);
  }

  const state = useParsedScript(source);

  return (
    <>
      <SourcePicker mode={source.kind} onSourceChange={handleSourceChange} />

      {state.status === "loading" && <div className={styles.centered}>Loading…</div>}
      {state.status === "error" && <ErrorState error={state.error} />}
      {state.status === "ready" && state.data.kind !== "element" && (
        <div className={styles.centered}>Unexpected document shape - root is not an element.</div>
      )}
      {state.status === "ready" && state.data.kind === "element" && <ScriptViewer key={sourceVersion} root={state.data} />}
    </>
  );
}

export default App;
