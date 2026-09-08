"use client";

import { Button, Checkbox } from "@kv-designsystem/react";
import { useState } from "react";

export function FacetGroup({
  field,
  label,
  values,
  selected,
  initialVisibleCount,
  onToggle,
}: {
  field: string;
  label: string;
  values: Array<{ name: string; count: number }>;
  selected: string[];
  initialVisibleCount?: number;
  onToggle: (field: string, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncate = initialVisibleCount != null && !expanded;
  const visible = truncate ? values.slice(0, initialVisibleCount) : values;
  const hasMore =
    initialVisibleCount != null && values.length > initialVisibleCount;

  return (
    <fieldset>
      <legend>{label}</legend>
      {visible.map((v) => (
        <Checkbox
          key={v.name}
          label={`${v.label ?? v.name} (${v.count})`}
          value={v.name}
          checked={selected.includes(v.name)}
          onChange={() => onToggle(field, v.name)}
        />
      ))}
      {hasMore && (
        <Button
          variant="tertiary"
          data-size="sm"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Vis mindre" : "Vis flere"}
        </Button>
      )}
    </fieldset>
  );
}
