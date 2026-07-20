"use client";

import { Tag } from "@kv-designsystem/react";
import Link from "next/link";
import styles from "./DatasetHeader.module.css";

export function DatasetHeader({
  title,
  organization,
  access,
}: {
  title: string;
  organization: string;
  access: string;
}) {
  return (
    <div className={styles.header}>
      <nav aria-label={"Brødsmulesti"} className={styles.breadcrumb}>
        <Link href="/">Geonorge</Link> {"›"}{" "}
        <Link href="/">Kartkatalogen</Link> {"›"} {title}
      </nav>
      <Tag data-color="info">{access}</Tag>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.organization}>Datasett fra {organization}</p>
    </div>
  );
}
