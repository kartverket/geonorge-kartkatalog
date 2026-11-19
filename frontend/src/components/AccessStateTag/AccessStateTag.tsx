"use client";

import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import { useDictionary } from "@/components/I18nProvider";
import type { AccessState } from "@/lib/schemas/product";
import styles from "./AccessStateTag.module.css";

export type AccessTagContext =
  | "tilgang"
  | "datasett"
  | "tjeneste"
  | "tjenestelag"
  | "applikasjon"
  | "datasettserie";

const COLOR: Record<AccessState, string> = {
  open: "success",
  restricted: "warning",
  protected: "danger",
};

export function AccessStateTag({
  accessState,
  context,
  showIcon = true,
}: {
  accessState: AccessState | null;
  context: AccessTagContext;
  showIcon?: boolean;
}) {
  const labels = useDictionary().accessState;
  if (!accessState) return null;

  return (
    <span
      className={`ds-tag ${styles.tag}`}
      data-color={COLOR[accessState]}
      data-size="sm"
    >
      {showIcon &&
        (accessState === "open" ? (
          <PadlockUnlockedIcon aria-hidden className={styles.tagIcon} />
        ) : (
          <PadlockLockedIcon aria-hidden className={styles.tagIcon} />
        ))}
      {labels[context][accessState]}
    </span>
  );
}
