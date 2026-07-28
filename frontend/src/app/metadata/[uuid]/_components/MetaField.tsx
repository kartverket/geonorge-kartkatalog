"use client";
import { Button, Tooltip } from "@kv-designsystem/react";
import { QuestionmarkCircleIcon } from "@navikt/aksel-icons";
import styles from "@/app/metadata/[uuid]/_components/DatasetMeta.module.css";

export function MetaField({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className={styles.dt}>
        {label}
        <Tooltip content={help} placement="top">
          <Button
            aria-label={`Mer informasjon om ${label}`}
            variant="tertiary"
            icon
          >
            <QuestionmarkCircleIcon aria-hidden />
          </Button>
        </Tooltip>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
