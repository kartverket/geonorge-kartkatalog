"use client";

import { Button } from "@kv-designsystem/react";
import { BulletListIcon, SquareGridIcon } from "@navikt/aksel-icons";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ViewToggle.module.css";

export type ViewMode = "grid" | "list";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <fieldset aria-label="Visning" className={styles.toggle}>
      <Button
        variant="secondary"
        data-icon
        aria-pressed={value === "list"}
        aria-label="Liste"
        onClick={() => {
          trackClick("list-view", LOCATIONS.SearchPage);
          onChange("list");
        }}
      >
        <BulletListIcon aria-hidden />
      </Button>
      <Button
        variant="secondary"
        data-icon
        aria-pressed={value === "grid"}
        aria-label="Rutenett"
        onClick={() => {
          trackClick("grid-view", LOCATIONS.SearchPage);
          onChange("grid");
        }}
      >
        <SquareGridIcon aria-hidden />
      </Button>
    </fieldset>
  );
}
