import Breadcrumbs from "@/app/_components/Breadcrumbs/Breadcrumbs";
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
      <Breadcrumbs
        segments={[
          { label: "Geonorge", href: "/" },
          { label: "Kartkatalogen", href: "/" },
          { label: title ?? "-" },
        ]}
      />
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
