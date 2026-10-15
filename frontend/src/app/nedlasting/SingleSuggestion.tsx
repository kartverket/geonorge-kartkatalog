"use client";

import { Suggestion } from "@kv-designsystem/react";
import { useRef } from "react";

export type SuggestionOption = {
  label: string;
  value: string;
};

type SingleSuggestionProps = {
  isOrdering?: boolean;
  noOptionsLabel?: string;
  onChangeAction: (value: string | null) => void;
  options: SuggestionOption[];
  placeholder?: string;
  selectedValue: string | null;
};

export function SingleSuggestion({
  isOrdering = false,
  noOptionsLabel = "Ingen alternativer tilgjengelig",
  onChangeAction,
  options,
  placeholder = "Velg alternativ",
  selectedValue,
}: SingleSuggestionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );
  const selected = selectedValue ? optionByValue.get(selectedValue) : undefined;
  const emptyLabel = options.length === 0 ? noOptionsLabel : "Ingen treff";

  return (
    <Suggestion
      selected={selected}
      onSelectedChange={(nextSelected) => {
        requestAnimationFrame(() => {
          const input = inputRef.current;
          if (!input) return;

          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });

        if (!isOrdering) {
          onChangeAction(nextSelected ? nextSelected.value : null);
        }
      }}
    >
      <Suggestion.Input
        ref={inputRef}
        placeholder={placeholder}
        disabled={options.length === 0 || isOrdering}
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
