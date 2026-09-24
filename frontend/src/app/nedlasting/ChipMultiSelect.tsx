"use client";

import { Chip, Select } from "@kv-designsystem/react";
import styles from "./ChipMultiSelect.module.css";

export type ChipSelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type ChipSelectProps = {
  allSelectedLabel?: string;
  id: string;
  noOptionsLabel?: string;
  onChangeAction: (values: string[]) => void;
  options: ChipSelectOption[];
  placeholder?: string;
  selectedValues: string[];
};

export function ChipMultiSelect({
  allSelectedLabel = "Alle valg er valgt",
  id,
  noOptionsLabel = "Ingen alternativer tilgjengelig",
  onChangeAction,
  options,
  placeholder = "Velg alternativ",
  selectedValues,
}: ChipSelectProps) {
  const selectedSet = new Set(selectedValues);
  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );

  const selectedOptions = selectedValues
    .map((value) => optionByValue.get(value))
    .filter((option): option is ChipSelectOption => Boolean(option));

  const selectableOptions = options.filter((option) => !option.disabled);
  const availableOptions = selectableOptions.filter(
    (option) => !selectedSet.has(option.value),
  );

  function handleSelectChange(nextValue: string) {
    if (!nextValue || selectedValues.includes(nextValue)) return;
    onChangeAction([...selectedValues, nextValue]);
  }

  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    const value = event.currentTarget.dataset.value;
    if (value) {
      onChangeAction(selectedValues.filter((selected) => selected !== value));
    }
  }

  const selectMessage =
    selectableOptions.length === 0
      ? noOptionsLabel
      : availableOptions.length === 0
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
            >
              {option.label}
            </Chip.Removable>
          ))}
        </div>
      ) : null}

      <Select
        id={id}
        value=""
        onChange={(event) => handleSelectChange(event.target.value)}
        disabled={availableOptions.length === 0}
      >
        <Select.Option value="">{selectMessage}</Select.Option>

        {availableOptions.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </>
  );
}
