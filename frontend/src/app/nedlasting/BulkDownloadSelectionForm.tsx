"use client";

import { Field, Heading, Label } from "@kv-designsystem/react";
import { useState } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import { ChipMultiSelect } from "./ChipMultiSelect";
import styles from "./DownloadOptionsForm.module.css";
import {
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  resolveCommonDownloadAvailability,
  selectDownloadAreas,
  selectDownloadFormats,
  selectDownloadProjections,
} from "./downloadUtils";

type BulkDownloadSelectionFormProps = {
  optionsList: (DownloadOptions | null)[];
  isLoading: boolean;
  isOrdering?: boolean;
  onApplyToAllAction: (
    update: (selection: DownloadSelection) => DownloadSelection,
  ) => void;
};

export function BulkDownloadSelectionForm({
  optionsList,
  isLoading,
  isOrdering = false,
  onApplyToAllAction,
}: BulkDownloadSelectionFormProps) {
  const [selection, setSelection] = useState<DownloadSelection>(
    EMPTY_DOWNLOAD_SELECTION,
  );
  const availability = resolveCommonDownloadAvailability(
    optionsList,
    selection,
  );

  function changeArea(areaCodes: string[]) {
    const update = (current: DownloadSelection) =>
      selectDownloadAreas(current, areaCodes);
    setSelection(update);
    onApplyToAllAction(update);
  }

  function changeProjection(projectionCodes: string[]) {
    const update = (current: DownloadSelection) =>
      selectDownloadProjections(current, projectionCodes);
    setSelection(update);
    onApplyToAllAction(update);
  }

  function changeFormat(formatNames: string[]) {
    const update = (current: DownloadSelection) =>
      selectDownloadFormats(current, formatNames);
    setSelection(update);
    onApplyToAllAction(update);
  }

  return (
    <div>
      <Heading level={2} data-size="sm">
        Velg for alle produkter
      </Heading>
      {isLoading ? (
        <p>Henter nedlastingsvalg...</p>
      ) : (
        <div className={styles.selectionFields}>
          <Field className={styles.selectionField}>
            <Label>Geografisk område</Label>
            <ChipMultiSelect
              selectedValues={selection.areaCodes}
              onChangeAction={changeArea}
              options={availability.areaOptions.map((option) => ({
                label: option.area.name,
                value: option.area.code,
              }))}
              placeholder="Velg geografisk område"
              isOrdering={isOrdering}
            />
            {availability.areaOptions.length === 0 ? (
              <p className={styles.emptyMessage}>
                Ingen felles geografiske områder for alle valgte produkter.
              </p>
            ) : null}
          </Field>
          {selection.areaCodes.length > 0 ? (
            <Field className={styles.selectionField}>
              <Label>Projeksjon</Label>
              <ChipMultiSelect
                selectedValues={selection.projectionCodes}
                onChangeAction={changeProjection}
                options={availability.projectionOptions.map((projection) => ({
                  label: projection.name,
                  value: projection.code,
                }))}
                placeholder="Velg projeksjon"
                isOrdering={isOrdering}
              />
              {availability.projectionOptions.length === 0 ? (
                <p className={styles.emptyMessage}>
                  Ingen felles projeksjoner for valgte områder i alle produkter.
                </p>
              ) : null}
            </Field>
          ) : null}
          {selection.projectionCodes.length > 0 ? (
            <Field className={styles.selectionField}>
              <Label>Format</Label>
              {availability.formatOptions.length === 0 ? (
                <p className={styles.emptyMessage}>
                  Ingen felles formater for alle valgte produkter med disse
                  projeksjonene.
                </p>
              ) : (
                <ChipMultiSelect
                  selectedValues={selection.formatNames}
                  onChangeAction={changeFormat}
                  options={availability.formatOptions.map((format) => ({
                    label: format.name,
                    value: format.name,
                  }))}
                  placeholder="Velg format"
                  isOrdering={isOrdering}
                />
              )}
            </Field>
          ) : null}
        </div>
      )}
    </div>
  );
}
