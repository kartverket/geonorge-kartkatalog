import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import styles from "./ProductHeader.module.css";

export function ProductHeader({
  title,
  organization,
  isOpen,
  hierarchyLevel,
}: {
  title: string | null;
  organization: string | null;
  isOpen: boolean | null;
  hierarchyLevel: string | null;
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
        {getProductTypeString(hierarchyLevel)} fra{" "}
        <Link href="#">{organization ?? "-"}</Link>
      </p>
    </div>
  );
}

const getProductTypeString = (hierarchyLevel: string | null) => {
  switch (hierarchyLevel) {
    case "dataset":
      return "Datasett";
    case "series":
      return "Datasettserie";
    case "service":
      return "Tjeneste";
    case "software":
      return "Applikasjon";
    default:
      return "Produkt";
  }
};
