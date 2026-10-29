"use client";

import { Button, Field, Label, Tag } from "@kv-designsystem/react";
import { XMarkIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import { DrawAreaDialog } from "./DrawAreaDialog";
import styles from "./DownloadOptionsForm.module.css";
import type {
  DownloadAreaBlock,
  DownloadAreaBlockAvailability,
} from "./downloadUtils";
import { MultiSuggestion } from "./MultiSuggestion";
import { SingleSuggestion } from "./SingleSuggestion";

type AreaBlockFieldsProps = {
  block: DownloadAreaBlock;
  availability: DownloadAreaBlockAvailability;
  excludedAreaCodes: string[];
  isOrdering?: boolean;
  canRemove: boolean;
  onChangeAreaAction: (areaCode: string | null) => void;
  onChangePolygonAction: (polygon: string | null) => void;
  onChangeProjectionsAction: (projectionCodes: string[]) => void;
  onChangeFormatsAction: (formatNames: string[]) => void;
  onRemoveAction: () => void;
};

export function AreaBlockFields({
  block,
  availability,
  excludedAreaCodes,
  isOrdering = false,
  canRemove,
  onChangeAreaAction,
  onChangePolygonAction,
  onChangeProjectionsAction,
  onChangeFormatsAction,
  onRemoveAction,
}: AreaBlockFieldsProps) {
  const [isDrawingArea, setIsDrawingArea] = useState(false);

  const areaOptions = availability.areaOptions.filter(
    (option) =>
      option.area.code === block.areaCode ||
      !excludedAreaCodes.includes(option.area.code),
  );

  const hasArea = Boolean(block.areaCode || block.polygon);

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
            Geografisk område
            <Tag
              data-color="warning"
              className={hasArea ? styles.hiddenTag : undefined}
            >
              Påkrevd
            </Tag>
          </Label>
          {block.polygon ? (
            <div className={styles.customAreaSummary}>
              <span>Egendefinert område tegnet på kart</span>
              <Button
                type="button"
                variant="tertiary"
                data-size="sm"
                onClick={() => onChangePolygonAction(null)}
              >
                Fjern
              </Button>
            </div>
          ) : (
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
          )}
          <div className={styles.areaInputButtons}>
            <Button
              type="button"
              variant="secondary"
              data-size="sm"
              disabled={!availability.supportsPolygonSelection}
              onClick={() => setIsDrawingArea(true)}
            >
              Velg fra kart
            </Button>
            <Button type="button" variant="secondary" data-size="sm" disabled>
              Last opp egen fil
            </Button>
          </div>
        </Field>
        <Field className={styles.selectionField}>
          <Label>
            Projeksjon
            <Tag
              data-color="warning"
              className={
                block.projectionCodes.length > 0 ? styles.hiddenTag : undefined
              }
            >
              Påkrevd
            </Tag>
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
            disabled={!hasArea}
          />
        </Field>
        <Field className={styles.selectionField}>
          <Label>
            Format
            <Tag
              data-color="warning"
              className={
                block.formatNames.length > 0 ? styles.hiddenTag : undefined
              }
            >
              Påkrevd
            </Tag>
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
            disabled={block.projectionCodes.length === 0}
          />
        </Field>
      </div>
      <DrawAreaDialog
        open={isDrawingArea}
        onCloseAction={() => setIsDrawingArea(false)}
        onConfirmAction={(coordinates) => {
          onChangePolygonAction(coordinates);
          setIsDrawingArea(false);
        }}
      />
    </div>
  );
}
