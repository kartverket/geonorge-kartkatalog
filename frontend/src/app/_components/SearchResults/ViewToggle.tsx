"use client";

import { Button } from "@kv-designsystem/react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export type ViewMode = "grid" | "list";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <fieldset aria-label="Visning" style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        variant={value === "grid" ? "primary" : "secondary"}
        aria-pressed={value === "grid"}
        onClick={() => {
          trackClick("grid-view", LOCATIONS.SearchPage);
          onChange("grid");
        }}
      >
        Rutenett
      </Button>
      <Button
        variant={value === "list" ? "primary" : "secondary"}
        aria-pressed={value === "list"}
        onClick={() => {
          trackClick("list-view", LOCATIONS.SearchPage);
          onChange("list");
        }}
      >
        Liste
      </Button>
    </fieldset>
  );
}
