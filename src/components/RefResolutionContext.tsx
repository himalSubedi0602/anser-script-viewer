import { createContext, useContext } from "react";
import type { RefIndexes, ResolvedRef } from "../lib/xmlRefResolver";

export interface RefResolutionValue {
  indexes: RefIndexes;
  highlightedAnchorId: string | undefined;
  onActivateRef: (ref: ResolvedRef) => void;
}

const RefResolutionContext = createContext<RefResolutionValue | undefined>(undefined);

export const RefResolutionProvider = RefResolutionContext.Provider;

/** Undefined outside a page that has resolution wired up (there is currently only
 * one: ScriptViewer's page body) - callers must treat "no context" as "don't
 * attempt to resolve," not as an error. */
export function useRefResolution(): RefResolutionValue | undefined {
  return useContext(RefResolutionContext);
}
