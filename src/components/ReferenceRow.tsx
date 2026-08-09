import type { XmlElementNode } from "../lib/xmlParser.types";
import type { ResolvedRef } from "../lib/xmlRefResolver";
import { AttributeBadges } from "./AttributeBadges";
import fieldGroupStyles from "./FieldGroup.module.css";
import styles from "./ReferenceRow.module.css";

const REF_TARGET_LABEL: Record<ResolvedRef["kind"], string> = {
  fieldRef: "field",
  navScreen: "page",
  labelStyle: "style",
  inputStyle: "style",
};

/**
 * Renders a resolved cross-reference (FieldRef/NavScreen/LabelStyle/InputStyle) as a
 * clickable row - same layout as FieldGroup's ordinary leaf row, but the value is a
 * button that jumps to (and highlights) whatever it resolved to.
 */
export function ReferenceRow({
  node,
  resolved,
  onActivate,
}: {
  node: XmlElementNode;
  resolved: ResolvedRef;
  onActivate: () => void;
}) {
  return (
    <div className={fieldGroupStyles.leafRow}>
      <span className={fieldGroupStyles.label}>{node.name}</span>
      <AttributeBadges attributes={node.attributes} />
      <button type="button" className={styles.refLink} onClick={onActivate}>
        {resolved.refValue} → go to {REF_TARGET_LABEL[resolved.kind]}
      </button>
    </div>
  );
}
