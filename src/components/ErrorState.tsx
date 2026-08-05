import { XmlParseError } from "../lib/xmlParser.types";
import styles from "./ErrorState.module.css";

/**
 * Distinguishes why loading failed, since the two cases mean different things to a
 * reviewer: XmlParseError means the file was reached but its content is invalid XML;
 * anything else means the file itself couldn't be loaded (network/fetch failure).
 */
export function ErrorState({ error }: { error: Error }) {
  const isParseError = error instanceof XmlParseError;

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon} aria-hidden="true">
        ⚠
      </div>
      <h1>{isParseError ? "The script XML is invalid" : "Couldn't load the script"}</h1>
      <p className={styles.message}>{error.message}</p>
      <p className={styles.hint}>
        {isParseError
          ? "The file was reached, but its contents could not be parsed as XML. Check that it is well-formed."
          : "The script.xml file could not be fetched. Check that it's available and try reloading."}
      </p>
      <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
        Reload page
      </button>
    </div>
  );
}
