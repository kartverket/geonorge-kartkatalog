import { Button } from "@kv-designsystem/react";
import { BulletListIcon, SquareGridIcon } from "@navikt/aksel-icons";
import { useDictionary } from "@/components/I18nProvider";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ViewToggle.module.css";
import type { ViewMode } from "./viewMode";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const t = useDictionary().viewToggle;
  return (
    <fieldset aria-label={t.label} className={styles.toggle}>
      <Button
        variant="secondary"
        data-icon
        aria-pressed={value === "list"}
        aria-label={t.list}
        onClick={() => {
          trackClick("list-view", LOCATIONS.SearchPage);
          onChange("list");
        }}
      >
        <BulletListIcon aria-hidden />
      </Button>
      <Button
        variant="secondary"
        data-icon
        aria-pressed={value === "grid"}
        aria-label={t.grid}
        onClick={() => {
          trackClick("grid-view", LOCATIONS.SearchPage);
          onChange("grid");
        }}
      >
        <SquareGridIcon aria-hidden />
      </Button>
    </fieldset>
  );
}
