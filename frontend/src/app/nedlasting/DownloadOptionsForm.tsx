"use client";

import { Checkbox, Select, Tag } from "@kv-designsystem/react";
import { useId } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import styles from "./DownloadOptionsForm.module.css";
import { getAvailableFormats, getAvailableProjections } from "./downloadUtils";

type DownloadOptionsFormProps = {
  error: string | null;
  isLoading: boolean;
  onAreaChangeAction: (areaCode: string) => void;
  onFormatToggleAction: (formatName: string) => void;
  onProjectionChangeAction: (projectionCode: string) => void;
  options: DownloadOptions | null;
  selectedAreaCode: string;
  selectedFormatNames: string[];
  selectedProjectionCode: string;
};

export function DownloadOptionsForm({
  error,
  isLoading,
  onAreaChangeAction,
  onFormatToggleAction,
  onProjectionChangeAction,
  options,
  selectedAreaCode,
  selectedFormatNames,
  selectedProjectionCode,
}: DownloadOptionsFormProps) {
  const areaId = useId();
  const projectionId = useId();
  const projections = getAvailableProjections(options);
  const availableFormats = getAvailableFormats(options, selectedProjectionCode);

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
          value={selectedAreaCode}
          onChange={(event) => onAreaChangeAction(event.target.value)}
        >
          <Select.Option value="">Velg geografisk område</Select.Option>
          {options.areas.map((area) => (
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
          value={selectedProjectionCode}
          onChange={(event) => onProjectionChangeAction(event.target.value)}
        >
          <Select.Option value="">Velg projeksjon</Select.Option>
          {projections.map((projection) => (
            <Select.Option key={projection.code} value={projection.code}>
              {projection.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      {selectedProjectionCode ? (
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
                checked={selectedFormatNames.includes(format.name)}
                onChange={() => onFormatToggleAction(format.name)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
