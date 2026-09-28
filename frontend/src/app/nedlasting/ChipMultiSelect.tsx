"use client";

import { Chip, Select } from "@kv-designsystem/react";
import type { MouseEvent } from "react";
import styles from "./ChipMultiSelect.module.css";

export type ChipSelectOption = {
  label: string;
  value: string;
};

export type ChipSelectOptionGroup = {
  label: string;
  options: ChipSelectOption[];
};

type ChipSelectProps = {
  allSelectedLabel?: string;
  isOrdering?: boolean;
  noOptionsLabel?: string;
  onChangeAction: (values: string[]) => void;
  options: ChipSelectOption[] | ChipSelectOptionGroup[];
  placeholder?: string;
  selectedValues: string[];
};

function isGroupedOptions(
  options: ChipSelectOption[] | ChipSelectOptionGroup[],
): options is ChipSelectOptionGroup[] {
  return options.every(
    (option): option is ChipSelectOptionGroup => "options" in option,
  );
}

export function ChipMultiSelect({
  allSelectedLabel = "Alle valg er valgt",
  isOrdering = false,
  noOptionsLabel = "Ingen alternativer tilgjengelig",
  onChangeAction,
  options,
  placeholder = "Velg alternativ",
  selectedValues,
}: ChipSelectProps) {
  const groups: ChipSelectOptionGroup[] = isGroupedOptions(options)
    ? options
    : [{ label: "", options }];
  const flatOptions = groups.flatMap((group) => group.options);

  const selectedSet = new Set(selectedValues);
  const optionByValue = new Map(
    flatOptions.map((option) => [option.value, option]),
  );

  const selectedOptions = selectedValues
    .map((value) => optionByValue.get(value))
    .filter((option): option is ChipSelectOption => Boolean(option));

  const availableSet = new Set(
    flatOptions
      .filter((option) => !selectedSet.has(option.value))
      .map((option) => option.value),
  );
  const availableGroups = groups
    .map((group) => ({
      label: group.label,
      options: group.options.filter((option) => availableSet.has(option.value)),
    }))
    .filter((group) => group.options.length > 0);

  function handleSelectChange(nextValue: string) {
    if (!nextValue || selectedValues.includes(nextValue)) return;
    onChangeAction([...selectedValues, nextValue]);
  }

  function handleRemoveClick(event: MouseEvent<HTMLButtonElement>) {
    const value = event.currentTarget.dataset.value;
    if (isOrdering) return;
    if (value) {
      onChangeAction(selectedValues.filter((selected) => selected !== value));
    }
  }

  const selectMessage =
    flatOptions.length === 0
      ? noOptionsLabel
      : availableSet.size === 0
        ? allSelectedLabel
        : placeholder;

  return (
    <>
      {selectedOptions.length > 0 ? (
        <div className={styles.selectedChipsContainer}>
          {selectedOptions.map((option) => (
            <Chip.Removable
              key={option.value}
              onClick={handleRemoveClick}
              data-value={option.value}
              disabled={isOrdering}
            >
              {option.label}
            </Chip.Removable>
          ))}
        </div>
      ) : null}

      <Select
        value=""
        onChange={(event) => handleSelectChange(event.target.value)}
        disabled={flatOptions.length === 0 || isOrdering}
      >
        <Select.Option value="">{selectMessage}</Select.Option>

        {availableGroups.map((group) =>
          group.label ? (
            <Select.Optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select.Optgroup>
          ) : (
            group.options.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))
          ),
        )}
      </Select>
    </>
  );
}
