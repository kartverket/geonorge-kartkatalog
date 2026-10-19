import { Search } from "@kv-designsystem/react";

type FacetSearchProps = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
};

export function FacetSearch({ ariaLabel, value, onChange }: FacetSearchProps) {
  return (
    <Search>
      <Search.Input
        aria-label={ariaLabel}
        placeholder="Søk"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Search>
  );
}
