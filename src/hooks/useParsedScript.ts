import { useEffect, useState } from "react";
import { parseXmlString } from "../lib/xmlParser";
import type { XmlNode } from "../lib/xmlParser.types";
import fixtureUrl from "../../fixtures/script.xml?url";

export type ParsedScriptState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; data: XmlNode };

/**
 * Fetches the real fixture over the network and parses it live, in the browser,
 * using the same parseXmlString the tests and generate-json script use. The UI
 * renders from this result - never from a pre-generated JSON file.
 */
export function useParsedScript(): ParsedScriptState {
  const [state, setState] = useState<ParsedScriptState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(fixtureUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch script.xml: ${response.status} ${response.statusText}`);
        }
        const xmlText = await response.text();
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
  }, []);

  return state;
}
