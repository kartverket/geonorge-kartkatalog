"use client";

import { Button } from "@kv-designsystem/react";
import { useState } from "react";
import styles from "./ProductMeta.module.css";

const PAGE_SIZE = 4;

export function ThemeTags({ themes }: { themes: string[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = themes.slice(0, visibleCount);
  const hasMore = visibleCount < themes.length;
  const canCollapse = !hasMore && themes.length > PAGE_SIZE;

  return (
    <div data-color="info">
      <div className={styles.tags} data-color="success">
        {visible.map((t) => (
          <span className="ds-tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="tertiary"
          className={styles.themesButton}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Vis mer
        </Button>
      )}
      {canCollapse && (
        <Button
          variant="tertiary"
          className={styles.themesButton}
          onClick={() => setVisibleCount(PAGE_SIZE)}
        >
          Skjul
        </Button>
      )}
    </div>
  );
}
