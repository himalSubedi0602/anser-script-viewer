import { XmlParseError } from "../lib/xmlParser.types";
import styles from "./ErrorState.module.css";

/**
 * Distinguishes why loading failed, since the two cases mean different things to a
 * reviewer: XmlParseError means the content was reached but is invalid XML; anything
 * else means the content itself couldn't be loaded (e.g. the fixture fetch failed).
 * Serves all three sources (fixture / pasted text / uploaded file), so the copy
 * can't assume the fixture's fetch-specific failure mode.
 */
export function ErrorState({ error }: { error: Error }) {
  const isParseError = error instanceof XmlParseError;

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon} aria-hidden="true">
        ⚠
      </div>
      <h1>{isParseError ? "The XML is invalid" : "Couldn't load the script"}</h1>
      <p className={styles.message}>{error.message}</p>
      <p className={styles.hint}>
        {isParseError
          ? "The content could not be parsed as XML. Check that it is well-formed."
          : "The script content could not be loaded. Check that it's available and try again."}
      </p>
      <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
        Reload page
      </button>
    </div>
  );
}
