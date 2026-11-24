"use client";

import { Tabs } from "@kv-designsystem/react";
import type { ReactNode } from "react";
import styles from "./TabPanel.module.css";

// Tabs.Panel is a member of a client export and is undefined when accessed
// from server components, so server tabs render panels through this wrapper.
export function TabPanel({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <Tabs.Panel value={value} className={styles.panel}>
      {children}
    </Tabs.Panel>
  );
}
