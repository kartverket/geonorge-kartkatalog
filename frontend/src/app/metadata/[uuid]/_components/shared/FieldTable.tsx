import type { Field } from "@/app/metadata/[uuid]/_components/shared/FieldList";
import { getVisibleFields } from "@/app/metadata/[uuid]/_utils/tableContent";
import styles from "./FieldTable.module.css";

/** Fields without content are hidden; renders nothing if all are empty. */
export function FieldTable({
  fields,
  title,
  paddingBottom,
}: {
  fields: Field[];
  title?: string;
  paddingBottom?: boolean;
}) {
  const visible = getVisibleFields(fields);
  if (visible.length === 0) return null;

  return (
    <table
      className={`ds-table ${styles.fieldTable} ${paddingBottom ? styles.paddingBottom : undefined}`}
    >
      {title && (
        <thead>
          <tr>
            <th colSpan={2}>{title}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {visible.map((f, i) => {
          const key = `${i}-${f.label}`;
          return (
            <tr key={key}>
              <td className={styles.fieldLabel}>{f.label}</td>
              <td>{f.content}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
