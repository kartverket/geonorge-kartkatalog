"use client";

import { Button } from "@kv-designsystem/react";
import { useState } from "react";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductMeta.module.css";

const PAGE_SIZE = 4;

export function ThemeTags({
  themes,
  "data-color": dataColor = "success",
}: {
  themes: string[];
  "data-color"?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = themes.slice(0, visibleCount);
  const hasMore = visibleCount < themes.length;
  const canCollapse = !hasMore && themes.length > PAGE_SIZE;

  return (
    <div data-color="info">
      <div className={styles.tags} data-color={dataColor}>
        {visible.map((t) => (
          <span className="ds-tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="secondary"
          data-size="sm"
          className={styles.themesButton}
          onClick={() => {
            trackClick("show-more-themes", LOCATIONS.MetadataPage, {
              totalThemes: themes.length,
            });
            setVisibleCount((count) => count + PAGE_SIZE);
          }}
        >
          Vis mer
        </Button>
      )}
      {canCollapse && (
        <Button
          variant="secondary"
          data-size="sm"
          className={styles.themesButton}
          onClick={() => {
            trackClick("hide-themes", LOCATIONS.MetadataPage, {
              totalThemes: themes.length,
            });
            setVisibleCount(PAGE_SIZE);
          }}
        >
          Skjul
        </Button>
      )}
    </div>
  );
}
