import { Avatar } from "@kv-designsystem/react";
import { CheckmarkIcon } from "@navikt/aksel-icons";
import styles from "./DownloadStepper.module.css";

export type DownloadStep = "bestilling" | "last-ned";

const STEPS: { key: DownloadStep; label: string }[] = [
  { key: "bestilling", label: "Bestilling" },
  { key: "last-ned", label: "Last ned" },
];

export function DownloadStepper({ step }: { step: DownloadStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <ol className={styles.stepper} aria-label="Fremdrift i bestilling">
      {STEPS.flatMap((s, index) => {
        const status =
          index < currentIndex
            ? "completed"
            : index === currentIndex
              ? "active"
              : "upcoming";

        const stepItem = (
          <li
            key={s.key}
            className={styles.step}
            data-status={status}
            aria-current={status === "active" ? "step" : undefined}
          >
            <Avatar className={styles.circle} data-size="sm" aria-hidden="true">
              {status === "completed" ? <CheckmarkIcon /> : String(index + 1)}
            </Avatar>
            <span className={styles.label}>{s.label}</span>
          </li>
        );

        if (index === STEPS.length - 1) return [stepItem];

        return [
          stepItem,
          <li
            key={`${s.key}-connector`}
            className={styles.connector}
            aria-hidden="true"
          />,
        ];
      })}
    </ol>
  );
}
