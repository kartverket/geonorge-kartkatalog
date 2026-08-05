import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import type { AccessState } from "@/lib/schemas/product";
import styles from "./ProductHeader.module.css";

export function ProductHeader({
  title,
  organization,
  access,
}: {
  title: string | null;
  organization: string | null;
  access: AccessState | null;
}) {
  return (
    <div className={styles.header}>
      <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
        <Link href="/">Geonorge</Link> {"›"} <Link href="/">Kartkatalogen</Link>{" "}
        {"›"} <span className={styles.current}>{title ?? "-"}</span>
      </nav>
      <AccessLock accessState={access} />
      <h1 className={styles.title}>{title ?? "-"}</h1>
      <p className={styles.organization}>
        Datasett fra <Link href="#">{organization ?? "-"}</Link>
      </p>
    </div>
  );
}

function AccessLock({ accessState }: { accessState: AccessState | null }) {
  switch (accessState) {
    case "protected":
      return (
        <span className="ds-tag" data-color="danger">
          <PadlockLockedIcon aria-hidden className={styles.tagIcon} />
          Beskyttet datasett
        </span>
      );
    case "restricted":
      return (
        <span className="ds-tag" data-color="warning">
          <PadlockLockedIcon aria-hidden className={styles.tagIcon} />
          Begrenset datasett
        </span>
      );
    case "open":
    case null:
    default:
      return (
        <span className="ds-tag" data-color="info">
          <PadlockUnlockedIcon aria-hidden className={styles.tagIcon} />
          Åpent datasett
        </span>
      );
  }
}
