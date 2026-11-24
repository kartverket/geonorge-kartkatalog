import type { ReactNode } from "react";
import { getVisibleFields } from "@/app/metadata/[uuid]/_utils/tableContent";
import styles from "./FieldList.module.css";

export type Field = { label: string; content?: ReactNode };

/** Fields without content are hidden; renders nothing if all are empty. */
export function FieldList({ fields }: { fields: Field[] }) {
  const visible = getVisibleFields(fields);
  if (visible.length === 0) return null;

  return (
    <dl className={styles.fieldList}>
      {visible.map((f, i) => {
        const key = `${i}-${f.label}`;
        return (
          <div className={styles.fieldRow} key={key}>
            <dt className={styles.fieldLabel}>{f.label}</dt>
            <dd className={styles.fieldValue}>{f.content}</dd>
          </div>
        );
      })}
    </dl>
  );
}
