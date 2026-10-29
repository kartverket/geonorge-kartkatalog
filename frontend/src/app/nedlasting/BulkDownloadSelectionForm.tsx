"use client";

import { Button, Heading, ValidationMessage } from "@kv-designsystem/react";
import { PlusIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import { AreaBlockFields } from "./AreaBlockFields";
import boxStyles from "./BulkDownloadSelectionForm.module.css";
import styles from "./DownloadOptionsForm.module.css";
import {
  addAreaBlock,
  type DownloadSelection,
  getDownloadSelectionGapCounts,
  removeAreaBlock,
  resolveUnionDownloadAvailability,
  selectAreaBlockArea,
  selectAreaBlockFormats,
  selectAreaBlockProjections,
} from "./downloadUtils";

const EMPTY_BULK_SELECTION: DownloadSelection = {
  areaBlocks: [{ areaCode: null, polygon: null, projectionCodes: [], formatNames: [] }],
};

type BulkDownloadSelectionFormProps = {
  optionsList: (DownloadOptions | null)[];
  isLoading: boolean;
  isOrdering?: boolean;
  onApplyToAllAction: (bulkSelection: DownloadSelection) => void;
};

export function BulkDownloadSelectionForm({
  optionsList,
  isLoading,
  isOrdering = false,
  onApplyToAllAction,
}: BulkDownloadSelectionFormProps) {
  const [selection, setSelection] =
    useState<DownloadSelection>(EMPTY_BULK_SELECTION);

  function updateSelection(next: DownloadSelection) {
    setSelection(next);
  }

  return (
    <div className={boxStyles.box}>
      <Heading level={2} data-size="sm">
        Valg for alle datasett
      </Heading>
      {isLoading ? (
        <p>Henter nedlastingsvalg...</p>
      ) : (
        <div className={styles.areaBlocks}>
          {selection.areaBlocks.map((block, blockIndex) => {
            const excludedAreaCodes = selection.areaBlocks
              .filter((_, index) => index !== blockIndex)
              .flatMap((otherBlock) =>
                otherBlock.areaCode ? [otherBlock.areaCode] : [],
              );
            const availability = resolveUnionDownloadAvailability(
              optionsList,
              block,
            );
            const gapCounts = getDownloadSelectionGapCounts(optionsList, block);

            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: samme begrunnelse som i DownloadOptionsForm.tsx
              <div key={blockIndex}>
                <AreaBlockFields
                  // biome-ignore lint/suspicious/noArrayIndexKey: samme begrunnelse som i DownloadOptionsForm.tsx
                  key={blockIndex}
                  block={block}
                  availability={availability}
                  excludedAreaCodes={excludedAreaCodes}
                  isOrdering={isOrdering}
                  canRemove={selection.areaBlocks.length > 1}
                  onChangeAreaAction={(areaCode) =>
                    updateSelection(
                      selectAreaBlockArea(selection, blockIndex, areaCode),
                    )
                  }
                  onChangeProjectionsAction={(projectionCodes) =>
                    updateSelection(
                      selectAreaBlockProjections(
                        selection,
                        blockIndex,
                        projectionCodes,
                      ),
                    )
                  }
                  onChangeFormatsAction={(formatNames) =>
                    updateSelection(
                      selectAreaBlockFormats(
                        selection,
                        blockIndex,
                        formatNames,
                      ),
                    )
                  }
                  onRemoveAction={() =>
                    updateSelection(removeAreaBlock(selection, blockIndex))
                  }
                  onChangePolygonAction={() => {}}
                />
                {block.areaCode && gapCounts.areas > 0 ? (
                  <ValidationMessage data-color="warning">
                    {gapCounts.areas} datasett har ikke valgte områder.
                  </ValidationMessage>
                ) : null}
                {block.projectionCodes.length > 0 &&
                gapCounts.projections > 0 ? (
                  <ValidationMessage data-color="warning">
                    {gapCounts.projections} datasett har ikke valgte
                    projeksjoner.
                  </ValidationMessage>
                ) : null}
                {block.formatNames.length > 0 && gapCounts.formats > 0 ? (
                  <ValidationMessage data-color="warning">
                    {gapCounts.formats} datasett har ikke valgte formater.
                  </ValidationMessage>
                ) : null}
              </div>
            );
          })}
          <div data-color="accent" className={styles.addAreaBlockButton}>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => updateSelection(addAreaBlock(selection))}
            >
              <PlusIcon aria-hidden />
              Legg til nytt område
            </Button>
          </div>
        </div>
      )}
      <div className={boxStyles.applyButtonContainer}>
        <Button
          type="button"
          variant="primary"
          disabled={isOrdering}
          onClick={() => {
            trackClick("apply-bulk-selection", LOCATIONS.DownloadPage, {
              areaBlockCount: selection.areaBlocks.length,
            });
            onApplyToAllAction(selection);
          }}
        >
          Bruk for alle
        </Button>
      </div>
    </div>
  );
}
