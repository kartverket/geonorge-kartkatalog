"use client";

import { Checkbox, Select, Tag } from "@kv-designsystem/react";
import { useId } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
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
  options: DownloadOptions | null;
  selection: DownloadSelection;
  onSelectionChangeAction: (selection: DownloadSelection) => void;
};

export function DownloadOptionsForm({
  error,
  isLoading,
  options,
  selection,
  onSelectionChangeAction,
}: DownloadOptionsFormProps) {
  const areaId = useId();
  const projectionId = useId();
  const areaGroups = options ? getAreaOptionGroups(options.areas) : [];
  const projections = getAvailableProjections(options);
  const availableFormats = getAvailableFormats(
    options,
    selection.projectionCode,
  );

  function changeArea(areaCode: string) {
    onSelectionChangeAction({ ...selection, areaCode });
  }

  function changeProjection(projectionCode: string) {
    onSelectionChangeAction({ ...selection, projectionCode, formatNames: [] });
  }

  function toggleFormat(formatName: string) {
    const formatNames = selection.formatNames.includes(formatName)
      ? selection.formatNames.filter((name) => name !== formatName)
      : [...selection.formatNames, formatName];
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
      <div className={styles.selectionField}>
        <label className={styles.fieldLabel} htmlFor={areaId}>
          Geografisk område <Tag data-color="warning">Påkrevd</Tag>
        </label>
        <Select
          id={areaId}
          value={selection.areaCode}
          onChange={(event) => changeArea(event.target.value)}
        >
          <Select.Option value="">Velg geografisk område</Select.Option>
          {areaGroups.length > 0
            ? areaGroups.map((group) => (
                <Select.Optgroup key={group.label} label={group.label}>
                  {group.areas.map((area) => (
                    <Select.Option key={area.code} value={area.code}>
                      {area.name}
                    </Select.Option>
                  ))}
                </Select.Optgroup>
              ))
            : options.areas.map((area) => (
                <Select.Option key={area.code} value={area.code}>
                  {area.name}
                </Select.Option>
              ))}
        </Select>
      </div>
      <div className={styles.selectionField}>
        <label className={styles.fieldLabel} htmlFor={projectionId}>
          Projeksjon <Tag data-color="warning">Påkrevd</Tag>
        </label>
        <Select
          id={projectionId}
          value={selection.projectionCode}
          onChange={(event) => changeProjection(event.target.value)}
        >
          <Select.Option value="">Velg projeksjon</Select.Option>
          {projections.map((projection) => (
            <Select.Option key={projection.code} value={projection.code}>
              {projection.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      {selection.projectionCode ? (
        <fieldset className={styles.formatField}>
          <legend className={styles.fieldLabel}>
            Format <Tag data-color="warning">Påkrevd</Tag>
          </legend>
          <div className={styles.formatOptions}>
            {availableFormats.map((format) => (
              <Checkbox
                key={format.name}
                label={format.name}
                value={format.name}
                checked={selection.formatNames.includes(format.name)}
                onChange={() => toggleFormat(format.name)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
