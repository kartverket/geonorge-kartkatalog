"use client";

import { Field, Heading, Label } from "@kv-designsystem/react";
import { useState } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import { ChipMultiSelect } from "./ChipMultiSelect";
import styles from "./DownloadOptionsForm.module.css";
import {
  type DownloadSelection,
  EMPTY_DOWNLOAD_SELECTION,
  getAreaOptionGroups,
  getCommonAreas,
  getCommonFormats,
  getCommonProjections,
} from "./downloadUtils";

type BulkDownloadSelectionFormProps = {
  optionsList: (DownloadOptions | null)[];
  isLoading: boolean;
  onApplyToAll: (
    update: (selection: DownloadSelection) => DownloadSelection,
  ) => void;
};

export function BulkDownloadSelectionForm({
  optionsList,
  isLoading,
  onApplyToAll,
}: BulkDownloadSelectionFormProps) {
  const [selection, setSelection] = useState<DownloadSelection>(
    EMPTY_DOWNLOAD_SELECTION,
  );
  const commonAreas = getCommonAreas(optionsList);
  const areaGroups = getAreaOptionGroups(commonAreas);
  const areas = areaGroups.flatMap((group) => group.areas);
  const commonProjections = getCommonProjections(optionsList);
  const commonFormats = getCommonFormats(
    optionsList,
    selection.projectionCodes,
  );

  function changeArea(areaCodes: string[]) {
    setSelection((current) => ({ ...current, areaCodes }));
    onApplyToAll((productSelection) => ({ ...productSelection, areaCodes }));
  }

  function changeProjection(projectionCodes: string[]) {
    setSelection((current) => ({
      ...current,
      projectionCodes,
      formatNames: [],
    }));
    onApplyToAll((productSelection) => ({
      ...productSelection,
      projectionCodes,
      formatNames: [],
    }));
  }

  function changeFormat(formatNames: string[]) {
    setSelection((current) => ({ ...current, formatNames }));
    onApplyToAll((productSelection) => ({ ...productSelection, formatNames }));
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
              options={areas.map((area) => ({
                label: area.name,
                value: area.code,
              }))}
              placeholder="Velg geografisk område"
            />
            {commonAreas.length === 0 ? (
              <p className={styles.emptyMessage}>
                Ingen felles geografiske områder for alle valgte produkter.
              </p>
            ) : null}
          </Field>
          <Field className={styles.selectionField}>
            <Label>Projeksjon</Label>
            <ChipMultiSelect
              selectedValues={selection.projectionCodes}
              onChangeAction={changeProjection}
              options={commonProjections.map((projection) => ({
                label: projection.name,
                value: projection.code,
              }))}
              placeholder="Velg projeksjon"
            />
            {commonProjections.length === 0 ? (
              <p className={styles.emptyMessage}>
                Ingen felles projeksjoner for alle valgte produkter.
              </p>
            ) : null}
          </Field>
          {selection.projectionCodes.length > 0 ? (
            <Field className={styles.selectionField}>
              <Label>Format</Label>
              {commonFormats.length === 0 ? (
                <p className={styles.emptyMessage}>
                  Ingen felles formater for alle valgte produkter med disse
                  projeksjonene.
                </p>
              ) : (
                <ChipMultiSelect
                  selectedValues={selection.formatNames}
                  onChangeAction={changeFormat}
                  options={commonFormats.map((format) => ({
                    label: format.name,
                    value: format.name,
                  }))}
                  placeholder="Velg format"
                />
              )}
            </Field>
          ) : null}
        </div>
      )}
    </div>
  );
}
