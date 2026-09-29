"use client";

import { Field, Label, Tag } from "@kv-designsystem/react";
import type { DownloadOptions } from "@/lib/schemas/download";
import { ChipMultiSelect } from "./ChipMultiSelect";
import styles from "./DownloadOptionsForm.module.css";
import type { DownloadSelection } from "./downloadUtils";
import {
  getAreaOptionGroups,
  getAvailableFormats,
  getAvailableProjections,
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
  const areaGroups = options ? getAreaOptionGroups(options.areas) : [];
  const projections = getAvailableProjections(options, selection.areaCodes);
  const availableFormats = getAvailableFormats(
    options,
    selection.areaCodes,
    selection.projectionCodes,
  );

  function changeArea(areaCodes: string[]) {
    onSelectionChangeAction({
      areaCodes,
      projectionCodes: [],
      formatNames: [],
    });
  }

  function changeProjection(projectionCodes: string[]) {
    onSelectionChangeAction({
      ...selection,
      projectionCodes,
      formatNames: [],
    });
  }

  function changeFormat(formatNames: string[]) {
    onSelectionChangeAction({ ...selection, formatNames });
  }

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
    <div className={styles.selectionFields}>
      <Field className={styles.selectionField}>
        <Label>
          Geografisk område <Tag data-color="warning">Påkrevd</Tag>
        </Label>
        <ChipMultiSelect
          selectedValues={selection.areaCodes}
          onChangeAction={changeArea}
          options={areaGroups.map((group) => ({
            label: group.label,
            options: group.areas.map((area) => ({
              label: area.name,
              value: area.code,
            })),
          }))}
          placeholder="Velg geografisk område"
          isOrdering={isOrdering}
        />
      </Field>
      {selection.areaCodes.length > 0 ? (
        <Field className={styles.selectionField}>
          <Label>
            Projeksjon <Tag data-color="warning">Påkrevd</Tag>
          </Label>
          <ChipMultiSelect
            selectedValues={selection.projectionCodes}
            onChangeAction={changeProjection}
            options={projections.map((projection) => ({
              label: projection.name,
              value: projection.code,
            }))}
            placeholder="Velg projeksjon"
            noOptionsLabel="Ingen felles projeksjoner for valgte områder"
            isOrdering={isOrdering}
          />
        </Field>
      ) : null}
      {selection.projectionCodes.length > 0 ? (
        <Field className={styles.selectionField}>
          <Label>
            Format <Tag data-color="warning">Påkrevd</Tag>
          </Label>
          <ChipMultiSelect
            selectedValues={selection.formatNames}
            onChangeAction={changeFormat}
            options={availableFormats.map((format) => ({
              label: format.name,
              value: format.name,
            }))}
            placeholder="Velg format"
            noOptionsLabel="Ingen formater tilgjengelig for valgte projeksjoner"
            isOrdering={isOrdering}
          />
        </Field>
      ) : null}
    </div>
  );
}
