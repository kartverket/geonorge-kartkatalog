"use client";

import { Heading } from "@kv-designsystem/react";
import Link from "next/link";
import styles from "@/app/metadata/[uuid]/not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.content}>
      <Heading>Datasettet ble ikke funnet</Heading>
      <p>Det finnes ingen metadata for denne IDen.</p>
      <Link href="/">Tilbake til forsiden</Link>
    </div>
  );
}
