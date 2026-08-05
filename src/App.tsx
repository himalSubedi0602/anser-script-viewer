import { useParsedScript } from "./hooks/useParsedScript";
import { ScriptViewer } from "./components/ScriptViewer";
import styles from "./App.module.css";

function App() {
  const state = useParsedScript();

  if (state.status === "loading") {
    return <div className={styles.centered}>Loading script.xml…</div>;
  }

  if (state.status === "error") {
    // Basic version for now - plan item 11 gives this its own dedicated,
    // clearer treatment per the "handle invalid XML clearly" requirement.
    return (
      <div className={styles.centered}>
        <h1>Couldn't load the script</h1>
        <p>{state.error.message}</p>
      </div>
    );
  }

  if (state.data.kind !== "element") {
    return <div className={styles.centered}>Unexpected document shape - root is not an element.</div>;
  }

  return <ScriptViewer root={state.data} />;
}

export default App;
