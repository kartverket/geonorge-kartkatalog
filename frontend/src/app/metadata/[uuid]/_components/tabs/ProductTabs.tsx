"use client";

import { Tabs } from "@kv-designsystem/react";
import type { ReactNode } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductTabs.module.css";

export type TabDefinition = { value: string; label: string };

export function ProductTabs({
  tabs,
  children,
}: {
  tabs: TabDefinition[];
  children: ReactNode;
}) {
  return (
    <div>
      <Tabs defaultValue={tabs[0]?.value} className={styles.tabs}>
        <Tabs.List>
          {tabs.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              onClick={() =>
                trackClick(`${t.value}-tab`, LOCATIONS.MetadataPageTabs)
              }
            >
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {children}
      </Tabs>
    </div>
  );
}
