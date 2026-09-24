"use client";

import { Tag } from "@kv-designsystem/react";
import { useId } from "react";
import {
  ChipMultiSelect,
  type ChipSelectOption,
} from "@/app/nedlasting/ChipMultiSelect";
import type { DownloadOptions } from "@/lib/schemas/download";
import styles from "./DownloadOptionsForm.module.css";
import { getAvailableFormats, getAvailableProjections } from "./downloadUtils";

type DownloadOptionsFormProps = {
  error: string | null;
  isLoading: boolean;
  onAreaChangeAction: (areaCodes: string[]) => void;
  onFormatChangeAction: (formatNames: string[]) => void;
  onProjectionChangeAction: (projectionCodes: string[]) => void;
  options: DownloadOptions | null;
  selectedAreaCode: string[];
  selectedFormatNames: string[];
  selectedProjectionCodes: string[];
};

export function DownloadOptionsForm({
  error,
  isLoading,
  onAreaChangeAction,
  onFormatChangeAction,
  onProjectionChangeAction,
  options,
  selectedAreaCode,
  selectedFormatNames,
  selectedProjectionCodes,
}: DownloadOptionsFormProps) {
  const areaId = useId();
  const projectionId = useId();
  const formatId = useId();
  const projections = getAvailableProjections(options);
  const availableFormats = getAvailableFormats(options, selectedProjectionCodes);

  if (isLoading) return <p>Henter nedlastingsvalg...</p>;

  if (!options) {
    return (
      <p>
        Kunne ikke hente nedlastingsvalg for dette datasettet.
        {error ? ` ${error}` : null}
      </p>
    );
  }

  const areaOptions: ChipSelectOption[] = options.areas.map((area) => ({
    label: area.name,
    value: area.code,
  }));
  const projectionOptions: ChipSelectOption[] = projections.map((projection) => ({
    label: projection.name,
    value: projection.code,
  }));
  const formatOptions: ChipSelectOption[] = availableFormats.map((format) => ({
    label: format.name,
    value: format.name,
  }));

  return (
    <div className={styles.selectionFields}>
      <div className={styles.selectionField}>
        <label className={styles.fieldLabel} htmlFor={areaId}>
          Geografisk område <Tag data-color="warning">Påkrevd</Tag>
        </label>
        <ChipMultiSelect
          id={areaId}
          selectedValues={selectedAreaCode}
          onChangeAction={onAreaChangeAction}
          options={areaOptions}
          placeholder="Velg geografisk område"
        />
      </div>
      <div className={styles.selectionField}>
        <label className={styles.fieldLabel} htmlFor={projectionId}>
          Projeksjon <Tag data-color="warning">Påkrevd</Tag>
        </label>
        <ChipMultiSelect
          id={projectionId}
          selectedValues={selectedProjectionCodes}
          onChangeAction={onProjectionChangeAction}
          options={projectionOptions}
          placeholder="Velg projeksjon"
        />
      </div>
      {selectedProjectionCodes.length > 0 ? (
        <div className={styles.selectionField}>
          <label className={styles.fieldLabel} htmlFor={formatId}>
            Format <Tag data-color="warning">Påkrevd</Tag>
          </label>
          <ChipMultiSelect
            id={formatId}
            selectedValues={selectedFormatNames}
            onChangeAction={onFormatChangeAction}
            options={formatOptions}
            placeholder="Velg format"
            noOptionsLabel="Ingen formater tilgjengelige for valgt projeksjon"
          />
        </div>
      ) : null}
    </div>
  );
}
