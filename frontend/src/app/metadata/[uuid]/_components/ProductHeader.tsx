import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import styles from "./ProductHeader.module.css";

export function ProductHeader({
  title,
  organization,
  isOpen,
}: {
  title: string | null;
  organization: string | null;
  isOpen: boolean | null;
}) {
  return (
    <div className={styles.header}>
      <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
        <Link href="/">Geonorge</Link> {"›"} <Link href="/">Kartkatalogen</Link>{" "}
        {"›"} <span className={styles.current}>{title ?? "-"}</span>
      </nav>
      <span className="ds-tag" data-color="info">
        {isOpen ? (
          <PadlockUnlockedIcon aria-hidden className={styles.tagIcon} />
        ) : (
          <PadlockLockedIcon aria-hidden className={styles.tagIcon} />
        )}
        {isOpen ? "Åpent datasett" : "Lukket datasett"}
      </span>
      <h1 className={styles.title}>{title ?? "-"}</h1>
      <p className={styles.organization}>
        Datasett fra <Link href="#">{organization ?? "-"}</Link>
      </p>
    </div>
  );
}
