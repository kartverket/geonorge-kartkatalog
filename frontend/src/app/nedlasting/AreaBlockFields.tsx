"use client";

import { Button, Field, Label, Tag } from "@kv-designsystem/react";
import { XMarkIcon } from "@navikt/aksel-icons";
import type { DownloadOptions } from "@/lib/schemas/download";
import styles from "./DownloadOptionsForm.module.css";
import {
  type DownloadAreaBlock,
  resolveAreaBlockAvailability,
} from "./downloadUtils";
import { MultiSuggestion } from "./MultiSuggestion";
import { SingleSuggestion } from "./SingleSuggestion";

type AreaBlockFieldsProps = {
  block: DownloadAreaBlock;
  options: DownloadOptions | null;
  excludedAreaCodes: string[];
  isOrdering?: boolean;
  canRemove: boolean;
  onChangeAreaAction: (areaCode: string | null) => void;
  onChangeProjectionsAction: (projectionCodes: string[]) => void;
  onChangeFormatsAction: (formatNames: string[]) => void;
  onRemoveAction: () => void;
};

export function AreaBlockFields({
  block,
  options,
  excludedAreaCodes,
  isOrdering = false,
  canRemove,
  onChangeAreaAction,
  onChangeProjectionsAction,
  onChangeFormatsAction,
  onRemoveAction,
}: AreaBlockFieldsProps) {
  const availability = resolveAreaBlockAvailability(options, block);
  const areaOptions = availability.areaOptions.filter(
    (option) => !excludedAreaCodes.includes(option.area.code),
  );

  return (
    <div className={styles.areaBlock}>
      {canRemove ? (
        <Button
          className={styles.removeBlockButton}
          variant="tertiary"
          data-size="sm"
          aria-label="Fjern område"
          onClick={onRemoveAction}
        >
          <XMarkIcon aria-hidden />
        </Button>
      ) : null}
      <div className={styles.selectionFields}>
        <Field className={styles.selectionField}>
          <Label>
            Geografisk område <Tag data-color="warning">Påkrevd</Tag>
          </Label>
          <SingleSuggestion
            selectedValue={block.areaCode}
            onChangeAction={onChangeAreaAction}
            options={areaOptions.map((option) => ({
              label: option.area.type
                ? `${option.area.name} (${option.area.type})`
                : option.area.name,
              value: option.area.code,
            }))}
            placeholder="Velg ett område"
            isOrdering={isOrdering}
          />
          <div className={styles.areaInputButtons}>
            <Button type="button" variant="secondary" data-size="sm" disabled>
              Velg fra kart
            </Button>
            <Button type="button" variant="secondary" data-size="sm" disabled>
              Last opp egen fil
            </Button>
          </div>
        </Field>
        {block.areaCode ? (
          <Field className={styles.selectionField}>
            <Label>
              Projeksjon <Tag data-color="warning">Påkrevd</Tag>
            </Label>
            <MultiSuggestion
              selectedValues={block.projectionCodes}
              onChangeAction={onChangeProjectionsAction}
              options={availability.projectionOptions.map((projection) => ({
                label: projection.name,
                value: projection.code,
              }))}
              placeholder="Velg en eller flere projeksjoner"
              noOptionsLabel="Ingen projeksjoner tilgjengelig for valgt område"
              isOrdering={isOrdering}
            />
          </Field>
        ) : null}
        {block.projectionCodes.length > 0 ? (
          <Field className={styles.selectionField}>
            <Label>
              Format <Tag data-color="warning">Påkrevd</Tag>
            </Label>
            <MultiSuggestion
              selectedValues={block.formatNames}
              onChangeAction={onChangeFormatsAction}
              options={availability.formatOptions.map((format) => ({
                label: format.name,
                value: format.name,
              }))}
              placeholder="Velg en eller flere formater"
              noOptionsLabel="Ingen formater tilgjengelig for valgte projeksjoner"
              isOrdering={isOrdering}
            />
          </Field>
        ) : null}
      </div>
    </div>
  );
}
