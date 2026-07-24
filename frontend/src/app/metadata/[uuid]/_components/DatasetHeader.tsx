"use client";

import { Tag } from "@kv-designsystem/react";
import { PadlockLockedIcon, PadlockUnlockedIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import styles from "./DatasetHeader.module.css";

export function DatasetHeader({
  title,
  organization,
  isOpen,
}: {
  // TODO: deale med null-verdier når vi har landet backendtyping
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
      <Tag data-color="info">
        {isOpen ? (
          <PadlockUnlockedIcon aria-hidden className={styles.tagIcon} />
        ) : (
          <PadlockLockedIcon aria-hidden className={styles.tagIcon} />
        )}
        {isOpen ? "Åpent datasett" : "Lukket datasett"}
      </Tag>
      <h1 className={styles.title}>{title ?? "-"}</h1>
      <p className={styles.organization}>
        Datasett fra <Link href="#">{organization ?? "-"}</Link>
      </p>
    </div>
  );
}
