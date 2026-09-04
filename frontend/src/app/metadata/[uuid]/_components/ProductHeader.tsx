import Link from "next/link";
import { AccessStateTag } from "@/components/AccessStateTag/AccessStateTag";
import { isBeta } from "@/lib/basePath";
import { getProductTypeString } from "@/lib/productType";
import type { AccessState } from "@/lib/schemas/product";
import styles from "./ProductHeader.module.css";

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
      <div className={styles.badgeRow}>
        <AccessStateTag accessState={access} context="tilgang" />
        <span className="ds-tag" data-color="neutral" data-size="sm">
          {organization ?? getProductTypeString(hierarchyLevel)}
        </span>
      </div>
      <h1 className={styles.title}>{title ?? "-"}</h1>
    </div>
  );
}
