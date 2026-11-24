"use client";

import { Tabs } from "@kv-designsystem/react";
import type { ReactNode } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export type TabDefinition = { value: string; label: string };

export function ProductTabs({
  tabs,
  children,
}: {
  tabs: TabDefinition[];
  children: ReactNode;
}) {
  return (
    <Tabs defaultValue={tabs[0]?.value}>
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
  );
}
