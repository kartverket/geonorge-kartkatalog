import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import type { AccessState } from "@/lib/schemas/product";
import styles from "./AccessStateTag.module.css";

const LABEL: Record<"tilgang" | "datasett", Record<AccessState, string>> = {
  tilgang: {
    open: "Åpen tilgang",
    restricted: "Begrenset tilgang",
    protected: "Beskyttet tilgang",
  },
  datasett: {
    open: "Åpent datasett",
    restricted: "Begrenset datasett",
    protected: "Beskyttet datasett",
  },
};

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
  context: "tilgang" | "datasett";
  showIcon?: boolean;
}) {
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
      {LABEL[context][accessState]}
    </span>
  );
}
