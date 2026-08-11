import { chunk } from "@/app/metadata/[uuid]/_utils/utils";
import styles from "./ProductMeta.module.css";

const PAGE_SIZE = 4;

export function ThemeTags({ themes }: { themes: string[] }) {
  const [firstChunk, ...rest] = chunk(themes, PAGE_SIZE);

  return (
    <>
      <div className={styles.tags} data-color="success">
        {firstChunk.map((t) => (
          <span className="ds-tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      {rest.length > 0 && <ThemeTagsRest chunks={rest} />}
    </>
  );
}

function ThemeTagsRest({ chunks }: { chunks: string[][] }) {
  const [firstChunk, ...rest] = chunks;

  return (
    <details className={styles.themesDetails}>
      <summary className="ds-button" data-variant="tertiary" data-color="info">
        Vis mer
      </summary>
      <div className={styles.tags} data-color="success">
        {firstChunk.map((t) => (
          <span className="ds-tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      {rest.length > 0 && <ThemeTagsRest chunks={rest} />}
    </details>
  );
}
