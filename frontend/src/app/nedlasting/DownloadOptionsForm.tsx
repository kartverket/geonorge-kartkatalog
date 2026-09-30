"use client";

import { Field, Label, Tag } from "@kv-designsystem/react";
import type { DownloadOptions } from "@/lib/schemas/download";
import { ChipMultiSelect } from "./ChipMultiSelect";
import styles from "./DownloadOptionsForm.module.css";
import type { DownloadSelection } from "./downloadUtils";
import {
  getAreaOptionGroups,
  resolveDownloadAvailability,
  selectDownloadAreas,
  selectDownloadFormats,
  selectDownloadProjections,
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
  const availability = resolveDownloadAvailability(options, selection);
  const areaGroups = getAreaOptionGroups(availability.areaOptions);

  function changeArea(areaCodes: string[]) {
    onSelectionChangeAction(selectDownloadAreas(selection, areaCodes));
  }

  function changeProjection(projectionCodes: string[]) {
    onSelectionChangeAction(
      selectDownloadProjections(selection, projectionCodes),
    );
  }

  function changeFormat(formatNames: string[]) {
    onSelectionChangeAction(selectDownloadFormats(selection, formatNames));
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
            options: group.areas.map((option) => ({
              label: option.area.name,
              value: option.area.code,
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
            options={availability.projectionOptions.map((projection) => ({
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
            options={availability.formatOptions.map((format) => ({
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
