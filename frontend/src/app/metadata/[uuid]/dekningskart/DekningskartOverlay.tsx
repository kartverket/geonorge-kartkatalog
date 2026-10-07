"use client";

import {
  Card,
  Checkbox,
  Details,
  Heading,
  Label,
} from "@kv-designsystem/react";
import styles from "./DekningskartOverlay.module.css";

interface DekningskartOverlayProps {
  layerVisibility: Record<string, boolean>;
  onVisibilityChange: (id: string, visible: boolean) => void;
}

export const DekningskartOverlay = ({
  layerVisibility,
  onVisibilityChange,
}: DekningskartOverlayProps) => {
  console.log(layerVisibility);
  return (
    <div className={styles.overlay}>
      <div className={styles.leftColumn}>
        <div className={styles.columnContent}>
          <Card className={styles.mapControlCard}>
            <Heading>Valg for visningen</Heading>
            <Details data-color="accent" variant="tinted" defaultOpen>
              <Details.Summary>Se dekningskart</Details.Summary>
              <Details.Content>
                <Label>Velg detaljeringsnivå</Label>
                <fieldset>
                  <LayerCheckbox
                    id="overview"
                    label="Kommune"
                    visible={layerVisibility.overview ?? true}
                    onVisibilityChange={onVisibilityChange}
                  />
                  <LayerCheckbox
                    id="coverage"
                    label="Rutenett"
                    visible={layerVisibility.coverage ?? true}
                    onVisibilityChange={onVisibilityChange}
                  />
                </fieldset>
              </Details.Content>
            </Details>
            <Details data-color="accent" variant="tinted" defaultOpen>
              <Details.Summary>Se fullstendighetsdekningskart</Details.Summary>
              <Details.Content>
                <fieldset>
                  <LayerCheckbox
                    id="completeness"
                    label="Fullstendighetsdekning"
                    visible={layerVisibility.completeness ?? true}
                    onVisibilityChange={onVisibilityChange}
                  />
                </fieldset>
              </Details.Content>
            </Details>
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
