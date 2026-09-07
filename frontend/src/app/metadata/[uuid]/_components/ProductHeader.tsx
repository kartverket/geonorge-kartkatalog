import Link from "next/link";
import { AccessStateTag } from "@/components/AccessStateTag/AccessStateTag";
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
      <div className={styles.badgeRow}>
        <AccessStateTag accessState={access} context="tilgang" />
        {organization && (
          <span
            className={`ds-tag ${styles.orgTag}`}
            data-color="neutral"
            data-size="sm"
          >
            {organization}
          </span>
        )}
      </div>
      <h1 className={styles.title}>{title ?? "-"}</h1>
    </div>
  );
}
