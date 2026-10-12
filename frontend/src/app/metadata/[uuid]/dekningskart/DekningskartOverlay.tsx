"use client";

import { Card, Checkbox, Details, Heading } from "@kv-designsystem/react";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./DekningskartOverlay.module.css";
import { statusColors } from "./styleFunctions";

interface DekningskartOverlayProps {
  metadata: ProductMetadata;
  layerVisibility: Record<string, boolean>;
  layerIds: string[];
  onVisibilityChange: (id: string, visible: boolean) => void;
}

const SymbologyBox = ({ color, label }: { color?: string; label: string }) => (
  <span className={styles.symbologyBox}>
    <div
      style={{
        backgroundColor: color,
        width: 24,
        height: 24,
      }}
    />
    <span>{label}</span>
  </span>
);

export const DekningskartOverlay = ({
  metadata,
  layerVisibility,
  layerIds,
  onVisibilityChange,
}: DekningskartOverlayProps) => {
  const showSymbology =
    layerVisibility.fullstendig ||
    layerVisibility.ufullstendig ||
    layerVisibility.ikkeKartlagt;
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
              <Details defaultOpen>
                <Details.Summary>Se dekningskart</Details.Summary>
                <Details.Content>
                  <legend>Velg detaljeringsnivå</legend>
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
            {layerIds.includes("fullstendig") ||
            layerIds.includes("ufullstendig") ||
            layerIds.includes("ikkeKartlagt") ? (
              <Details defaultOpen>
                <Details.Summary>
                  Se fullstendighetsdekningskart
                </Details.Summary>
                <Details.Content>
                  <fieldset>
                    {layerIds.includes("fullstendig") && (
                      <LayerCheckbox
                        id="fullstendig"
                        label="Fullstendig"
                        visible={layerVisibility.fullstendig}
                        onVisibilityChange={onVisibilityChange}
                      />
                    )}
                    {layerIds.includes("ufullstendig") && (
                      <LayerCheckbox
                        id="ufullstendig"
                        label="Ufullstendig"
                        visible={layerVisibility.ufullstendig}
                        onVisibilityChange={onVisibilityChange}
                      />
                    )}
                    {layerIds.includes("ikkeKartlagt") && (
                      <LayerCheckbox
                        id="ikkeKartlagt"
                        label="Ikke kartlagt"
                        visible={layerVisibility.ikkeKartlagt}
                        onVisibilityChange={onVisibilityChange}
                      />
                    )}
                  </fieldset>
                </Details.Content>
              </Details>
            ) : null}
          </Card>
          {showSymbology && (
            <Card className={styles.mapControlCard}>
              <Heading level={3}>Tegnforklaring</Heading>
              {layerVisibility.fullstendig && (
                <SymbologyBox
                  color={statusColors.get("fullstendig")}
                  label="Fullstendig"
                />
              )}
              {layerVisibility.ufullstendig && (
                <SymbologyBox
                  color={statusColors.get("ufullstendig")}
                  label="Ufullstendig"
                />
              )}
              {layerVisibility.ikkeKartlagt && (
                <SymbologyBox
                  color={statusColors.get("ikkeKartlagt")}
                  label="Ikke kartlagt"
                />
              )}
            </Card>
          )}
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
