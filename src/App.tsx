import { useParsedScript } from "./hooks/useParsedScript";

// TEMPORARY smoke-test render for plan item 9 (frontend data loading only).
// The real UI (client/script/version, page nav, element cards, etc.) is item 10
// and will replace this.
function App() {
  const state = useParsedScript();

  if (state.status === "loading") {
    return <p>Loading script.xml...</p>;
  }

  if (state.status === "error") {
    return <p>Error: {state.error.message}</p>;
  }

  const root = state.data;
  const childCount = root.kind === "element" ? root.children.length : 0;

  return (
    <div>
      <p>Parsed live in the browser.</p>
      <p>
        Root element: <code>{root.kind === "element" ? root.name : root.kind}</code>
      </p>
      <p>Root children: {childCount}</p>
    </div>
  );
}

export default App;
