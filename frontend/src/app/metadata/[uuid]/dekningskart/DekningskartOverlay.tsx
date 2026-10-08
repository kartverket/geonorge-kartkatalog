"use client";

import {
  Card,
  Checkbox,
  Details,
  Heading,
  Label,
} from "@kv-designsystem/react";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./DekningskartOverlay.module.css";

interface DekningskartOverlayProps {
  metadata: ProductMetadata;
  layerVisibility: Record<string, boolean>;
  layerIds: string[];
  onVisibilityChange: (id: string, visible: boolean) => void;
}

export const DekningskartOverlay = ({
  metadata,
  layerVisibility,
  layerIds,
  onVisibilityChange,
}: DekningskartOverlayProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.leftColumn}>
        <div className={styles.columnContent}>
          <Card className={styles.mapControlCard}>
            <Heading level={4} data-size={"xs"}>
              {metadata.title}
            </Heading>
            {(layerIds.includes("overview") ||
              layerIds.includes("coverage")) && (
              <Details data-color="accent" variant="tinted" defaultOpen>
                <Details.Summary>Se dekningskart</Details.Summary>
                <Details.Content>
                  <Label>Velg detaljeringsnivå</Label>
                  <fieldset>
                    {layerIds.includes("overview") ? (
                      <LayerCheckbox
                        id="overview"
                        label="Kommune"
                        visible={layerVisibility.overview}
                        onVisibilityChange={onVisibilityChange}
                      />
                    ) : null}
                    {layerIds.includes("coverage") ? (
                      <LayerCheckbox
                        id="coverage"
                        label="Rutenett"
                        visible={layerVisibility.coverage}
                        onVisibilityChange={onVisibilityChange}
                      />
                    ) : null}
                  </fieldset>
                </Details.Content>
              </Details>
            )}
            {layerIds.includes("completeness") && (
              <Details data-color="accent" variant="tinted" defaultOpen>
                <Details.Summary>
                  Se fullstendighetsdekningskart
                </Details.Summary>
                <Details.Content>
                  <fieldset>
                    <LayerCheckbox
                      id="completeness"
                      label="Fullstendighetsdekning"
                      visible={layerVisibility.completeness}
                      onVisibilityChange={onVisibilityChange}
                    />
                  </fieldset>
                </Details.Content>
              </Details>
            )}
          </Card>
          <Card className={styles.mapControlCard}>
            <Heading level={3}>Tegnforklaring</Heading>
            <p>soon ™️</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface LayerCheckboxProps {
  id: string;
  label: string;
  visible: boolean;
  onVisibilityChange: (id: string, visible: boolean) => void;
}

const LayerCheckbox = ({
  id,
  label,
  visible,
  onVisibilityChange,
}: LayerCheckboxProps) => (
  <Checkbox
    checked={visible}
    label={label}
    onChange={(event) => onVisibilityChange(id, event.target.checked)}
  />
);
