"use client";

import { Button, Checkbox, Heading } from "@kv-designsystem/react";
import { useState } from "react";
import { ChevronDownIcon } from "@navikt/aksel-icons";
import styles from "./FacetGroup.module.css";

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
    <fieldset className={styles.fieldset} suppressHydrationWarning>
      <legend className={styles.legend} suppressHydrationWarning>
        <Heading data-size="md">{label}</Heading>
      </legend>
      <div className={styles.checkboxes}>
        {visible.map((v) => (
          <Checkbox
            key={v.name}
            label={`${v.label ?? v.name} (${v.count})`}
            value={v.name}
            checked={selected.includes(v.name)}
            onChange={() => onToggle(field, v.name)}
          />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="secondary"
          data-size="sm"
          className={styles.showMore}
          onClick={() => setExpanded((e) => !e)}
        >
          <ChevronDownIcon aria-hidden />
          {expanded ? "Vis mindre" : "Vis flere"}
        </Button>
      )}
    </fieldset>
  );
}
