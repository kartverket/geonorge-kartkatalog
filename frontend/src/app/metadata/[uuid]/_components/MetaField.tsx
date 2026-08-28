"use client";
import { Button, Tooltip } from "@kv-designsystem/react";
import { QuestionmarkCircleIcon } from "@navikt/aksel-icons";
import styles from "@/app/metadata/[uuid]/_components/ProductMeta.module.css";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export function MetaField({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className={styles.dt}>
        {label}
        {help && (
          <Tooltip content={help} placement="top">
            <Button
              aria-label={`Mer informasjon om ${label}`}
              variant="tertiary"
              icon
              onClick={() =>
                trackClick("show-help", LOCATIONS.MetadataPage, {
                  label,
                })
              }
            >
              <QuestionmarkCircleIcon aria-hidden />
            </Button>
          </Tooltip>
        )}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
