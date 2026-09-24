"use client";

import { Chip, Select, Tag } from "@kv-designsystem/react";

type AreaOption = {
  code: string;
  name: string;
};

type AreaChipSelectProps = {
  id: string;
  label: string;
  options: AreaOption[];
  selectedValues: string[];
  onChangeAction: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
};

export function AreaChipSelect({
  id,
  label,
  options,
  selectedValues,
  onChangeAction,
  placeholder = "Velg geografisk område",
  required,
}: AreaChipSelectProps) {
  const selectedOptions = selectedValues
    .map((value) => options.find((option) => option.code === value))
    .filter((option): option is AreaOption => Boolean(option));

  const availableOptions = options.filter(
    (option) => !selectedValues.includes(option.code),
  );

  function handleSelectChange(nextValue: string) {
    if (!nextValue || selectedValues.includes(nextValue)) return;
    onChangeAction([...selectedValues, nextValue]);
  }

  function handleRemove(code: string) {
    onChangeAction(selectedValues.filter((value) => value !== code));
  }

  return (
    <div>
      <label htmlFor={id}>
        {label} {required ? <Tag data-color="warning">Påkrevd</Tag> : null}
      </label>

      {selectedOptions.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            margin: "0.5rem 0",
          }}
        >
          {selectedOptions.map((option) => (
            <Chip.Removable
              key={option.code}
              onClick={() => handleRemove(option.code)}
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
    </div>
  );
}
