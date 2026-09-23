"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@navikt/aksel-icons";
import styles from "./MultiSelectDropdown.module.css";

export type MultiSelectDropdownProps = {
  id: string;
  label: string;
  selectedValues: string[];
  onChangeAction: (values: string[]) => void;
  options: Array<{ code: string; name: string }>;
  placeholder?: string;
  required?: boolean;
};

export function MultiSelectDropdown({
  id,
  label,
  selectedValues,
  onChangeAction,
  options,
  placeholder = "Velg alternativer",
  required,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = (code: string) => {
    if (selectedValues.includes(code)) {
      onChangeAction(selectedValues.filter((v) => v !== code));
    } else {
      onChangeAction([...selectedValues, code]);
    }
  };

  const selectedNames = options
    .filter((opt) => selectedValues.includes(opt.code))
    .map((opt) => opt.name)
    .join(", ");

  return (
    <div className={styles.multiSelectContainer} ref={dropdownRef}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <button
        id={id}
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        type="button"
      >
        <span className={styles.selectedText}>
          {selectedNames || placeholder}
        </span>
        <ChevronDownIcon
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.length === 0 ? (
            <div className={styles.noOptions}>Ingen alternativer tilgjengelig</div>
          ) : (
            options.map((option) => (
              <label key={option.code} className={styles.option}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.code)}
                  onChange={() => handleToggle(option.code)}
                  className={styles.checkbox}
                />
                <span className={styles.optionLabel}>{option.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

