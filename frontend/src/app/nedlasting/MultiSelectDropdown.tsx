"use client";

import { ChevronDownIcon } from "@navikt/aksel-icons";
import { useEffect, useId, useRef, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      return;
    }

    searchInputRef.current?.focus();
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

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("no");
  const filteredOptions = options.filter((option) =>
    option.name.toLocaleLowerCase("no").includes(normalizedQuery),
  );

  function openDropdown() {
    setIsOpen(true);
  }

  function closeDropdown() {
    setIsOpen(false);
    setSearchQuery("");
  }

  return (
    <div className={styles.multiSelectContainer} ref={dropdownRef}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {isOpen ? (
        <div className={`${styles.trigger} ${styles.triggerOpen}`}>
          <input
            id={id}
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeDropdown();
              }
            }}
            placeholder={selectedNames || placeholder}
            className={styles.searchInput}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={searchInputId}
            aria-autocomplete="list"
            aria-haspopup="listbox"
          />
          <button
            type="button"
            className={styles.iconButton}
            onClick={closeDropdown}
            aria-label="Lukk liste"
          >
            <ChevronDownIcon
              className={`${styles.icon} ${styles.iconOpen}`}
              aria-hidden
            />
          </button>
        </div>
      ) : (
        <button
          id={id}
          className={styles.trigger}
          onClick={openDropdown}
          aria-expanded={isOpen}
          type="button"
        >
          <span className={styles.selectedText}>
            {selectedNames || placeholder}
          </span>
          <ChevronDownIcon className={styles.icon} aria-hidden />
        </button>
      )}

      {isOpen && (
        <div id={searchInputId} className={styles.dropdown} role="listbox">
          {options.length === 0 ? (
            <div className={styles.noOptions}>
              Ingen alternativer tilgjengelig
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className={styles.noOptions}>
              Ingen treff for “{searchQuery}”
            </div>
          ) : (
            filteredOptions.map((option) => (
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
