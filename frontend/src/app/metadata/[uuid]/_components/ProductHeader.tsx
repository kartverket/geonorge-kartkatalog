import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { isBeta } from "@/lib/basePath";
import { getProductTypeString } from "@/lib/productType";
import type { AccessState } from "@/lib/schemas/product";
import styles from "./ProductHeader.module.css";
import { Route } from "next";
const catalogUrl = process.env.KATALOG_BASE_URL ?? "/";

export function ProductHeader({
  title,
  organization,
  access,
  hierarchyLevel,
}: {
  title: string | null;
  organization: string | null;
  access: AccessState | null;
  hierarchyLevel: string | null;
}) {
  return (
    <div className={styles.header}>
      {!isBeta && (
        <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
          <Link href="/">Geonorge</Link> {"›"}{" "}
          <Link href="/">Kartkatalogen</Link> {"›"}{" "}
          <span className={styles.current}>{title ?? "-"}</span>
        </nav>
      )}
      <AccessLock accessState={access} />
      <h1 className={styles.title}>{title ?? "-"}</h1>
      <p className={styles.organization}>
        {getProductTypeString(hierarchyLevel)} fra{" "}
        <Link
          href={
            organization != null
              ? (`${catalogUrl}/?organizations=${encodeURIComponent(organization)}` as Route)
              : "#"
          }
        >
          {organization ?? "-"}
        </Link>
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
          Beskyttet tilgang
        </span>
      );
    case "restricted":
      return (
        <span className="ds-tag" data-color="warning">
          <PadlockLockedIcon aria-hidden className={styles.tagIcon} />
          Begrenset tilgang
        </span>
      );
    case "open":
      return (
        <span className="ds-tag" data-color="info">
          <PadlockUnlockedIcon aria-hidden className={styles.tagIcon} />
          Åpen tilgang
        </span>
      );
    default:
      return null;
  }
}
