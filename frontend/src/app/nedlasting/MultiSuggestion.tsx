"use client";

import { Suggestion } from "@kv-designsystem/react";
import { useRef } from "react";
import styles from "./MultiSuggestion.module.css";

export type ChipSelectOption = {
  label: string;
  value: string;
};

type ChipSelectProps = {
  allSelectedLabel?: string;
  disabled?: boolean;
  isOrdering?: boolean;
  noOptionsLabel?: string;
  onChangeAction: (values: string[]) => void;
  options: ChipSelectOption[];
  placeholder?: string;
  selectedValues: string[];
};

export function MultiSuggestion({
  allSelectedLabel = "Alle valg er valgt",
  disabled = false,
  isOrdering = false,
  noOptionsLabel = "Ingen alternativer tilgjengelig",
  onChangeAction,
  options,
  placeholder = "Velg alternativ",
  selectedValues,
}: ChipSelectProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );
  const selected = selectedValues.flatMap((value) => {
    const option = optionByValue.get(value);
    return option ? [option] : [];
  });
  const emptyLabel =
    options.length === 0
      ? noOptionsLabel
      : selected.length === options.length
        ? allSelectedLabel
        : "Ingen treff";

  return (
    <Suggestion
      className={styles.suggestion}
      multiple
      selected={selected}
      onSelectedChange={(nextSelected) => {
        requestAnimationFrame(() => {
          const input = inputRef.current;
          if (!input) return;

          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });

        if (!isOrdering) {
          onChangeAction(nextSelected.map((option) => option.value));
        }
      }}
    >
      <Suggestion.Input
        ref={inputRef}
        placeholder={placeholder}
        disabled={options.length === 0 || isOrdering || disabled}
      />
      <Suggestion.Clear aria-label="Tøm søk" />
      <Suggestion.List>
        <Suggestion.Empty>{emptyLabel}</Suggestion.Empty>
        {options.map((option) => (
          <Suggestion.Option
            key={option.value}
            label={option.label}
            value={option.value}
          >
            {option.label}
          </Suggestion.Option>
        ))}
      </Suggestion.List>
    </Suggestion>
  );
}
