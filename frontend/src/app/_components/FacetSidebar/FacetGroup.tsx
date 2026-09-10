"use client";

import { Button, Checkbox, Heading } from "@kv-designsystem/react";
import { ChevronDownIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import styles from "./FacetGroup.module.css";

type FacetValue = {
  name: string;
  label?: string | null;
  category?: string | null;
  count: number;
};

function ExpandableCheckbox({
  field,
  value,
  children,
  selected,
  onToggle,
}: {
  field: string;
  value: FacetValue;
  children: FacetValue[];
  selected: string[];
  onToggle: (field: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className={styles.expandableRow}>
        <Checkbox
          label={`${value.label ?? value.name} (${value.count})`}
          value={value.name}
          checked={selected.includes(value.name)}
          onChange={() => onToggle(field, value.name)}
        />
        <Button
          variant="tertiary"
          data-size="sm"
          aria-label={open ? "Skjul underkategorier" : "Vis underkategorier"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={open ? styles.chevronOpen : undefined}
        >
          <ChevronDownIcon aria-hidden />
        </Button>
      </div>
      {open && (
        <div className={styles.nestedCheckboxes}>
          {children.map((child) => (
            <Checkbox
              key={child.name}
              label={`${child.label ?? child.name} (${child.count})`}
              value={child.name}
              checked={selected.includes(child.name)}
              onChange={() => onToggle(field, child.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  values: FacetValue[];
  selected: string[];
  initialVisibleCount?: number;
  onToggle: (field: string, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const childrenByParent = new Map<string, FacetValue[]>();
  for (const v of values) {
    if (v.category == null) continue;
    const list = childrenByParent.get(v.category) ?? [];
    list.push(v);
    childrenByParent.set(v.category, list);
  }

  const topLevel = values.filter((v) => v.category == null);

  const truncate = initialVisibleCount != null && !expanded;
  const visibleTopLevel = truncate
    ? topLevel.slice(0, initialVisibleCount)
    : topLevel;
  const hasMore =
    initialVisibleCount != null && topLevel.length > initialVisibleCount;

  return (
    <fieldset className={styles.fieldset} suppressHydrationWarning>
      <legend className={styles.legend} suppressHydrationWarning>
        <Heading data-size="md">{label}</Heading>
      </legend>
      <div className={styles.checkboxes}>
        {visibleTopLevel.map((v) => {
          const children = childrenByParent.get(v.name);
          if (children && children.length > 0) {
            return (
              <ExpandableCheckbox
                key={v.name}
                field={field}
                value={v}
                children={children}
                selected={selected}
                onToggle={onToggle}
              />
            );
          }
          return (
            <Checkbox
              key={v.name}
              label={`${v.label ?? v.name} (${v.count})`}
              value={v.name}
              checked={selected.includes(v.name)}
              onChange={() => onToggle(field, v.name)}
            />
          );
        })}
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
