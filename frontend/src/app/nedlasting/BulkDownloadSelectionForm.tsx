"use client";

import { Checkbox, Heading, Select } from "@kv-designsystem/react";
import { useId, useState } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import styles from "./DownloadOptionsForm.module.css";
import {
  EMPTY_DOWNLOAD_SELECTION,
  getAreaOptionGroups,
  getCommonAreas,
  getCommonFormats,
  getCommonProjections,
  type DownloadSelection,
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
  const areaId = useId();
  const projectionId = useId();
  const [selection, setSelection] = useState<DownloadSelection>(
    EMPTY_DOWNLOAD_SELECTION,
  );
  const commonAreas = getCommonAreas(optionsList);
  const areaGroups = getAreaOptionGroups(commonAreas);
  const commonProjections = getCommonProjections(optionsList);
  const commonFormats = getCommonFormats(optionsList, selection.projectionCode);

  function changeArea(areaCode: string) {
    setSelection((current) => ({ ...current, areaCode }));
    onApplyToAll((productSelection) => ({ ...productSelection, areaCode }));
  }

  function changeProjection(projectionCode: string) {
    setSelection((current) => ({
      ...current,
      projectionCode,
      formatNames: [],
    }));
    onApplyToAll((productSelection) => ({
      ...productSelection,
      projectionCode,
      formatNames: [],
    }));
  }

  function toggleFormat(formatName: string) {
    const formatNames = selection.formatNames.includes(formatName)
      ? selection.formatNames.filter((name) => name !== formatName)
      : [...selection.formatNames, formatName];

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
          <div className={styles.selectionField}>
            <label className={styles.fieldLabel} htmlFor={areaId}>
              Geografisk område
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
                : commonAreas.map((area) => (
                    <Select.Option key={area.code} value={area.code}>
                      {area.name}
                    </Select.Option>
                  ))}
            </Select>
            {commonAreas.length === 0 ? (
              <p className={styles.emptyMessage}>
                Ingen felles geografiske områder for alle valgte produkter.
              </p>
            ) : null}
          </div>
          <div className={styles.selectionField}>
            <label className={styles.fieldLabel} htmlFor={projectionId}>
              Projeksjon
            </label>
            <Select
              id={projectionId}
              value={selection.projectionCode}
              onChange={(event) => changeProjection(event.target.value)}
            >
              <Select.Option value="">Velg projeksjon</Select.Option>
              {commonProjections.map((projection) => (
                <Select.Option key={projection.code} value={projection.code}>
                  {projection.name}
                </Select.Option>
              ))}
            </Select>
            {commonProjections.length === 0 ? (
              <p className={styles.emptyMessage}>
                Ingen felles projeksjoner for alle valgte produkter.
              </p>
            ) : null}
          </div>
          {selection.projectionCode ? (
            <fieldset className={styles.formatField}>
              <legend className={styles.fieldLabel}>Format</legend>
              {commonFormats.length === 0 ? (
                <p className={styles.emptyMessage}>
                  Ingen felles formater for alle valgte produkter med denne
                  projeksjonen.
                </p>
              ) : (
                <div className={styles.formatOptions}>
                  {commonFormats.map((format) => (
                    <Checkbox
                      key={format.name}
                      label={format.name}
                      value={format.name}
                      checked={selection.formatNames.includes(format.name)}
                      onChange={() => toggleFormat(format.name)}
                    />
                  ))}
                </div>
              )}
            </fieldset>
          ) : null}
        </div>
      )}
    </div>
  );
}
