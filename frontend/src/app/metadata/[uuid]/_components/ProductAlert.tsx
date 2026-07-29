import type { Alert } from "@/lib/schemas/alerts";
import styles from "./ProductAlert.module.css";

export default function ProductAlert({ alert }: { alert: Alert }) {
  return (
    <div className={styles.wrapper}>
      <div className="ds-alert" data-color="info">
        <h3 className="ds-heading" data-size="xs">
          {alert.alertType}
        </h3>
        <p className="ds-paragraph">{alert.note}</p>
      </div>
    </div>
  );
}
