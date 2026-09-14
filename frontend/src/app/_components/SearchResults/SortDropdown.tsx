"use client";

import { Select } from "@kv-designsystem/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./SortDropdown.module.css";

const SORT_OPTIONS = [
  { value: "score", label: "Mest relevant" },
  { value: "newest", label: "Nyeste" },
  { value: "updated", label: "Sist oppdatert" },
  { value: "title", label: "Tittel A-Å" },
  { value: "title_desc", label: "Tittel Å-A" },
  { value: "organization", label: "Organisasjon A-Å" },
  { value: "organization_desc", label: "Organisasjon Å-A" },
];

export function SortDropdown({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderby", event.target.value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      aria-label="Sorter søkeresultater"
      width="auto"
      className={styles.select}
    >
      {SORT_OPTIONS.map((option) => (
        <Select.Option key={option.value} value={option.value}>
          {option.label}
        </Select.Option>
      ))}
    </Select>
  );
}
