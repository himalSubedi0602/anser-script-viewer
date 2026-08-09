import { useEffect, useState } from "react";
import { parseXmlString } from "../lib/xmlParser";
import type { XmlNode } from "../lib/xmlParser.types";
import fixtureUrl from "../../fixtures/script.xml?url";

export type ParsedScriptState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; data: XmlNode };

export type ScriptSource = { kind: "fixture" } | { kind: "text"; xml: string } | { kind: "file"; file: File };

async function resolveSourceText(source: ScriptSource): Promise<string> {
  if (source.kind === "fixture") {
    const response = await fetch(fixtureUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch script.xml: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }
  if (source.kind === "text") return source.xml;
  return source.file.text();
}

/**
 * Loads XML from whichever source is currently selected - the bundled fixture (the
 * default), pasted text, or an uploaded file - and parses it live, in the browser,
 * using the same parseXmlString the tests and generate-json script use. The UI
 * renders from this result - never from a pre-generated JSON file, and never from a
 * second, forked parser for the paste/upload cases.
 */
export function useParsedScript(source: ScriptSource): ParsedScriptState {
  const [state, setState] = useState<ParsedScriptState>({ status: "loading" });

  // Reset to "loading" as soon as `source` changes, before the effect below even
  // runs - done during render (React's documented pattern for resetting state in
  // response to a changed prop), not inside the effect, since setState directly in
  // an effect body risks cascading renders.
  const [trackedSource, setTrackedSource] = useState(source);
  if (source !== trackedSource) {
    setTrackedSource(source);
    setState({ status: "loading" });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const xmlText = await resolveSourceText(source);
        const tree = parseXmlString(xmlText);
        if (!cancelled) setState({ status: "ready", data: tree });
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return state;
}
