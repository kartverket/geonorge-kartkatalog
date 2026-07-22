"use client";

import { Tabs } from "@kv-designsystem/react";
import styles from "./DatasetTabs.module.css";

const TABS = [
  { value: "info", label: "Informasjon om datasettet" },
  { value: "distribution", label: "Distribusjoner for datasett" },
  { value: "documentation", label: "Dokumentasjon" },
  { value: "quality", label: "Datakvalitet (FAIR)" },
];

export function DatasetTabs() {
  return (
    <div data-color="info">
      <Tabs defaultValue="info" className={styles.tabs}>
        <Tabs.List>
          {TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="info" className={styles.panel}>
          Informasjon-innhold kommer
        </Tabs.Panel>
        <Tabs.Panel value="distribution" className={styles.panel}>
          Distribusjoner-innhold kommer
        </Tabs.Panel>
        <Tabs.Panel value="documentation" className={styles.panel}>
          Dokumentasjon-innhold kommer
        </Tabs.Panel>
        <Tabs.Panel value="quality" className={styles.panel}>
          Datakvalitet-innhold kommer
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
