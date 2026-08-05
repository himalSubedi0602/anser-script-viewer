import { useParsedScript } from "./hooks/useParsedScript";
import { ScriptViewer } from "./components/ScriptViewer";
import { ErrorState } from "./components/ErrorState";
import styles from "./App.module.css";

function App() {
  const state = useParsedScript();

  if (state.status === "loading") {
    return <div className={styles.centered}>Loading script.xml…</div>;
  }

  if (state.status === "error") {
    return <ErrorState error={state.error} />;
  }

  if (state.data.kind !== "element") {
    return <div className={styles.centered}>Unexpected document shape - root is not an element.</div>;
  }

  return <ScriptViewer root={state.data} />;
}

export default App;
