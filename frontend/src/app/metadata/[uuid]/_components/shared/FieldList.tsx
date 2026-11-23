import type { ReactNode } from "react";
import styles from "@/app/metadata/[uuid]/_components/tabs/ProductTabs.module.css";

export type Field = { label: string; content?: ReactNode };

const hasContent = (content: ReactNode) =>
  content !== null &&
  content !== undefined &&
  content !== false &&
  content !== "";

export function getVisibleFields(fields: Field[]): Field[] {
  return fields.filter((f) => hasContent(f.content));
}

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
