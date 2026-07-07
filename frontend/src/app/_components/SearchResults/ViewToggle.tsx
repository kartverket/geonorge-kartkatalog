"use client";

import { Button } from "@kv-designsystem/react";

export type ViewMode = "grid" | "list";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Visning"
      style={{ display: "flex", gap: "0.5rem" }}
    >
      <Button
        variant={value === "grid" ? "primary" : "secondary"}
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
      >
        Rutenett
      </Button>
      <Button
        variant={value === "list" ? "primary" : "secondary"}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        Liste
      </Button>
    </div>
  );
}
