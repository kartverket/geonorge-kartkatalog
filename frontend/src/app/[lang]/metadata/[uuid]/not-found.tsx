"use client";

import { Heading } from "@kv-designsystem/react";
import Link from "next/link";
import styles from "@/app/[lang]/metadata/[uuid]/not-found.module.css";
import { useLocale } from "@/components/I18nProvider";
import { localizedPath } from "@/lib/i18n";

export default function NotFound() {
  const locale = useLocale();
  return (
    <div className={styles.content}>
      <Heading>Datasettet ble ikke funnet</Heading>
      <p>Det finnes ingen metadata for denne IDen.</p>
      <Link href={localizedPath(locale, "/")}>Tilbake til forsiden</Link>
    </div>
  );
}
