"use client";

import { Card, Checkbox, Details, Heading } from "@kv-designsystem/react";
import BreadCrumb from "@/app/_components/BreadCrumb/BreadCrumb";
import { basePath } from "@/lib/basePath";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./DekningskartOverlay.module.css";
import { statusColors } from "./styleFunctions";

interface DekningskartOverlayProps {
  uuid: string;
  metadata: ProductMetadata;
  layerVisibility: Record<string, boolean>;
  layerIds: string[];
  onVisibilityChange: (id: string, visible: boolean) => void;
}

const SymbologyBox = ({
  status,
  label,
}: {
  status?: string;
  label: string;
}) => (
  <div className={styles.symbologyBox}>
    <div
      className={styles.symbologyColorBox}
      style={{ backgroundColor: statusColors.get(status ?? "") }}
    />
    <span>{label}</span>
  </div>
);

export const DekningskartOverlay = ({
  uuid,
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
          <BreadCrumb
            segments={[
              { label: "Geonorge", href: "/" },
              { label: "Kartkatalogen", href: "/" },
              {
                label: metadata.title ?? "-",
                href: `${basePath}/metadata/${uuid}`,
              },
              { label: "Dekningsoversikt" },
            ]}
          />
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
              <Heading level={3} data-size="2xs">
                Tegnforklaring
              </Heading>
              <div className={styles.symbologyBoxContainer}>
                {layerVisibility.fullstendig && (
                  <SymbologyBox status={"fullstendig"} label="Fullstendig" />
                )}
                {layerVisibility.ufullstendig && (
                  <SymbologyBox status={"ufullstendig"} label="Ufullstendig" />
                )}
                {layerVisibility.ikkeKartlagt && (
                  <SymbologyBox status={"ikkeKartlagt"} label="Ikke kartlagt" />
                )}
              </div>
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
