"use client";

import { Select } from "@kv-designsystem/react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDictionary } from "@/components/I18nProvider";
import styles from "./SortDropdown.module.css";

const SORT_OPTIONS = [
  "score",
  "newest",
  "updated",
  "title",
  "title_desc",
  "organization",
  "organization_desc",
] as const;

export function SortDropdown({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useDictionary().sort;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderby", event.target.value);
    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      aria-label={t.label}
      width="auto"
      className={styles.select}
    >
      {SORT_OPTIONS.map((option) => (
        <Select.Option key={option} value={option}>
          {t.options[option]}
        </Select.Option>
      ))}
    </Select>
  );
}
