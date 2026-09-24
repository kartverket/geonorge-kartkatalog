"use client";

import { Checkbox, Heading, Select } from "@kv-designsystem/react";
import { useId } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import styles from "./DownloadOptionsForm.module.css";
import {
  getCommonAreas,
  getCommonFormats,
  getCommonProjections,
} from "./downloadUtils";

type BulkDownloadSelectionFormProps = {
  optionsList: (DownloadOptions | null)[];
  isLoading: boolean;
  onAreaChangeAction: (areaCode: string) => void;
  onFormatToggleAction: (formatName: string) => void;
  onProjectionChangeAction: (projectionCode: string) => void;
  selectedAreaCode: string;
  selectedFormatNames: string[];
  selectedProjectionCode: string;
};

export function BulkDownloadSelectionForm({
  optionsList,
  isLoading,
  onAreaChangeAction,
  onFormatToggleAction,
  onProjectionChangeAction,
  selectedAreaCode,
  selectedFormatNames,
  selectedProjectionCode,
}: BulkDownloadSelectionFormProps) {
  const areaId = useId();
  const projectionId = useId();
  const commonAreas = getCommonAreas(optionsList);
  const commonProjections = getCommonProjections(optionsList);
  const commonFormats = getCommonFormats(optionsList, selectedProjectionCode);

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
              value={selectedAreaCode}
              onChange={(event) => onAreaChangeAction(event.target.value)}
            >
              <Select.Option value="">Velg geografisk område</Select.Option>
              {commonAreas.map((area) => (
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
              value={selectedProjectionCode}
              onChange={(event) => onProjectionChangeAction(event.target.value)}
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
          {selectedProjectionCode ? (
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
                      checked={selectedFormatNames.includes(format.name)}
                      onChange={() => onFormatToggleAction(format.name)}
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
