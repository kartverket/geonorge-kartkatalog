"use client";

import {
  Field,
  Heading,
  Label,
  ValidationMessage,
} from "@kv-designsystem/react";
import { useState } from "react";
import type { DownloadOptions } from "@/lib/schemas/download";
import boxStyles from "./BulkDownloadSelectionForm.module.css";
import styles from "./DownloadOptionsForm.module.css";
import {
  type DownloadAreaBlock,
  EMPTY_AREA_BLOCK,
  getDownloadSelectionGapCounts,
  resolveUnionDownloadAvailability,
} from "./downloadUtils";
import { MultiSuggestion } from "./MultiSuggestion";
import { SingleSuggestion } from "./SingleSuggestion";

type BulkDownloadSelectionFormProps = {
  optionsList: (DownloadOptions | null)[];
  isLoading: boolean;
  isOrdering?: boolean;
  onApplyToAllAction: (bulkBlock: DownloadAreaBlock) => void;
};

export function BulkDownloadSelectionForm({
  optionsList,
  isLoading,
  isOrdering = false,
  onApplyToAllAction,
}: BulkDownloadSelectionFormProps) {
  const [block, setBlock] = useState<DownloadAreaBlock>(EMPTY_AREA_BLOCK);
  const availability = resolveUnionDownloadAvailability(optionsList, block);
  const gapCounts = getDownloadSelectionGapCounts(optionsList, block);

  function changeArea(areaCode: string | null) {
    const next: DownloadAreaBlock = {
      areaCode,
      projectionCodes: [],
      formatNames: [],
    };
    setBlock(next);
    onApplyToAllAction(next);
  }

  function changeProjection(projectionCodes: string[]) {
    const next: DownloadAreaBlock = {
      ...block,
      projectionCodes,
      formatNames: [],
    };
    setBlock(next);
    onApplyToAllAction(next);
  }

  function changeFormat(formatNames: string[]) {
    const next: DownloadAreaBlock = { ...block, formatNames };
    setBlock(next);
    onApplyToAllAction(next);
  }

  return (
    <div className={boxStyles.box}>
      <Heading level={2} data-size="sm">
        Valg for alle datasett
      </Heading>
      {isLoading ? (
        <p>Henter nedlastingsvalg...</p>
      ) : (
        <div className={boxStyles.fieldsRow}>
          <Field className={styles.selectionField}>
            <Label>Geografisk område</Label>
            <SingleSuggestion
              selectedValue={block.areaCode}
              onChangeAction={changeArea}
              options={availability.areaOptions.map((option) => ({
                label: option.area.type
                  ? `${option.area.name} (${option.area.type})`
                  : option.area.name,
                value: option.area.code,
              }))}
              placeholder="Velg geografisk område"
              isOrdering={isOrdering}
            />
            {availability.areaOptions.length === 0 ? (
              <ValidationMessage data-color="warning">
                Ingen geografiske områder tilgjengelig for valgte produkter.
              </ValidationMessage>
            ) : block.areaCode && gapCounts.areas > 0 ? (
              <ValidationMessage data-color="warning">
                {gapCounts.areas} datasett har ikke valgte områder.
              </ValidationMessage>
            ) : null}
          </Field>
          <Field className={styles.selectionField}>
            <Label>Projeksjon</Label>
            <MultiSuggestion
              selectedValues={block.projectionCodes}
              onChangeAction={changeProjection}
              options={availability.projectionOptions.map((projection) => ({
                label: projection.name,
                value: projection.code,
              }))}
              placeholder="Velg projeksjon"
              isOrdering={isOrdering}
            />
            {availability.projectionOptions.length === 0 ? (
              <ValidationMessage data-color="warning">
                Ingen projeksjoner tilgjengelig for valgte områder.
              </ValidationMessage>
            ) : block.projectionCodes.length > 0 &&
              gapCounts.projections > 0 ? (
              <ValidationMessage data-color="warning">
                {gapCounts.projections} datasett har ikke valgte projeksjoner.
              </ValidationMessage>
            ) : null}
          </Field>
          <Field className={styles.selectionField}>
            <Label>Format</Label>
            {availability.formatOptions.length === 0 ? (
              <ValidationMessage data-color="warning">
                Ingen formater tilgjengelig for valgte projeksjoner.
              </ValidationMessage>
            ) : (
              <>
                <MultiSuggestion
                  selectedValues={block.formatNames}
                  onChangeAction={changeFormat}
                  options={availability.formatOptions.map((format) => ({
                    label: format.name,
                    value: format.name,
                  }))}
                  placeholder="Velg format"
                  isOrdering={isOrdering}
                />
                {block.formatNames.length > 0 && gapCounts.formats > 0 ? (
                  <ValidationMessage data-color="warning">
                    {gapCounts.formats} datasett har ikke valgte formater.
                  </ValidationMessage>
                ) : null}
              </>
            )}
          </Field>
        </div>
      )}
    </div>
  );
}
