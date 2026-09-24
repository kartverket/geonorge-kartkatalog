"use client";

import { Chip, Select, Tag } from "@kv-designsystem/react";
import styles from "./AreaChipSelect.module.css";

type AreaOption = {
  code: string;
  name: string;
};

type AreaChipSelectProps = {
  id: string;
  options: AreaOption[];
  selectedValues: string[];
  onChangeAction: (values: string[]) => void;
  placeholder?: string;
};

export function AreaChipSelect({
  id,
  options,
  selectedValues,
  onChangeAction,
  placeholder = "Velg geografisk område",
}: AreaChipSelectProps) {
  const selectedSet = new Set(selectedValues);
  const optionByCode = new Map(options.map((option) => [option.code, option]));

  const selectedOptions = selectedValues
    .map((value) => optionByCode.get(value))
    .filter((option): option is AreaOption => Boolean(option));

  const availableOptions = options.filter((option) => !selectedSet.has(option.code));

  function handleSelectChange(nextValue: string) {
    if (!nextValue || selectedValues.includes(nextValue)) return;
    onChangeAction([...selectedValues, nextValue]);
  }

  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    const code = event.currentTarget.dataset.code;
    if (code) onChangeAction(selectedValues.filter((value) => value !== code));
  }



  return (
    <>
      {selectedOptions.length > 0 ? (
        <div className={styles.selectedChipsContainer}
        >
          {selectedOptions.map((option) => (
            <Chip.Removable
              key={option.code}
              onClick={handleRemoveClick}
              data-code={option.code}
            >
              {option.name}
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
        <Select.Option value="">
          {availableOptions.length === 0
            ? "Alle områder er valgt"
            : placeholder}
        </Select.Option>

        {availableOptions.map((area) => (
          <Select.Option key={area.code} value={area.code}>
            {area.name}
          </Select.Option>
        ))}
      </Select>
    </>
  );
}
