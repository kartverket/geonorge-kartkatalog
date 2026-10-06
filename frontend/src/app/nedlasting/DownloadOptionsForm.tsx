"use client";

import { PlusIcon } from "@navikt/aksel-icons";
import type { DownloadOptions } from "@/lib/schemas/download";
import { AreaBlockFields } from "./AreaBlockFields";
import styles from "./DownloadOptionsForm.module.css";
import {
  addAreaBlock,
  type DownloadSelection,
  removeAreaBlock,
  selectAreaBlockArea,
  selectAreaBlockFormats,
  selectAreaBlockProjections,
} from "./downloadUtils";

type DownloadOptionsFormProps = {
  error: string | null;
  isLoading: boolean;
  isOrdering?: boolean;
  options: DownloadOptions | null;
  selection: DownloadSelection;
  onSelectionChangeAction: (selection: DownloadSelection) => void;
};

export function DownloadOptionsForm({
  error,
  isLoading,
  isOrdering = false,
  options,
  selection,
  onSelectionChangeAction,
}: DownloadOptionsFormProps) {
  if (isLoading) return <p>Henter nedlastingsvalg...</p>;

  if (!options) {
    return (
      <p>
        Kunne ikke hente nedlastingsvalg for dette datasettet.
        {error ? ` ${error}` : null}
      </p>
    );
  }

  return (
    <div className={styles.areaBlocks}>
      {selection.areaBlocks.map((block, blockIndex) => (
        <AreaBlockFields
          key={blockIndex}
          block={block}
          options={options}
          isOrdering={isOrdering}
          canRemove={selection.areaBlocks.length > 1}
          onChangeAreaAction={(areaCode) =>
            onSelectionChangeAction(
              selectAreaBlockArea(selection, blockIndex, areaCode),
            )
          }
          onChangeProjectionsAction={(projectionCodes) =>
            onSelectionChangeAction(
              selectAreaBlockProjections(
                selection,
                blockIndex,
                projectionCodes,
              ),
            )
          }
          onChangeFormatsAction={(formatNames) =>
            onSelectionChangeAction(
              selectAreaBlockFormats(selection, blockIndex, formatNames),
            )
          }
          onRemoveAction={() =>
            onSelectionChangeAction(removeAreaBlock(selection, blockIndex))
          }
        />
      ))}
      <button
        type="button"
        className={styles.addAreaBlockButton}
        onClick={() => onSelectionChangeAction(addAreaBlock(selection))}
      >
        <PlusIcon aria-hidden />
        Legg til nytt område
      </button>
    </div>
  );
}
