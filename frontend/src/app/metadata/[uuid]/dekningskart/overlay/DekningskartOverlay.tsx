"use client";

import {
  Button,
  Card,
  Checkbox,
  Details,
  Heading,
} from "@kv-designsystem/react";
import { FilesIcon, XMarkIcon } from "@navikt/aksel-icons";
import type { Coordinate } from "ol/coordinate";
import type { FeatureInfo } from "@/app/_components/MapComponent/Content";
import type { Kommune } from "@/lib/schemas/kommune";
import { statusColors } from "../styleFunctions";
import styles from "./DekningskartOverlay.module.css";
import { FeatureInfoContent } from "./FeatureInfoContent";
import { HeightSection } from "./HeightSection";

export type LocationClickedInfo = {
  coordinate: Coordinate;
  featureInfoResults: FeatureInfo[];
  height: number;
};

interface DekningskartOverlayProps {
  kommunerByNummer: Record<string, Kommune>;
  layerVisibility: Record<string, boolean>;
  layerIds: string[];
  onVisibilityChange: (id: string, visible: boolean) => void;
  onFeatureInfoClose: () => void;
  locationClickedInfo?: LocationClickedInfo | null;
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
  kommunerByNummer,
  layerVisibility,
  layerIds,
  onVisibilityChange,
  onFeatureInfoClose,
  locationClickedInfo,
}: DekningskartOverlayProps) => {
  const showSymbology =
    layerVisibility.fullstendig ||
    layerVisibility.ufullstendig ||
    layerVisibility.ikkeKartlagt ||
    layerVisibility.ikkeRelevant;
  return (
    <div className={styles.overlay}>
      <div className={styles.leftColumn}>
        <div className={styles.columnContent}>
          <Card className={styles.mapControlCard}>
            <Heading level={4} data-size={"xs"}>
              Velg hva du ser
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
                  <Heading level={4} data-size={"2xs"}>
                    Velg status for kartlegging
                  </Heading>
                  <fieldset>
                    {layerIds.includes("fullstendig") && (
                      <LayerCheckbox
                        id="fullstendig"
                        label="Kartlagte områder"
                        visible={layerVisibility.fullstendig}
                        onVisibilityChange={onVisibilityChange}
                      />
                    )}
                    {layerIds.includes("ufullstendig") && (
                      <LayerCheckbox
                        id="ufullstendig"
                        label="Delvis kartlagte områder"
                        visible={layerVisibility.ufullstendig}
                        onVisibilityChange={onVisibilityChange}
                      />
                    )}
                    {layerIds.includes("ikkeKartlagt") && (
                      <LayerCheckbox
                        id="ikkeKartlagt"
                        label="Ikke kartlagte områder"
                        visible={layerVisibility.ikkeKartlagt}
                        onVisibilityChange={onVisibilityChange}
                      />
                    )}
                    {layerIds.includes("ikkeRelevant") && (
                      <LayerCheckbox
                        id="ikkeRelevant"
                        label="Ikke relevante områder"
                        visible={layerVisibility.ikkeRelevant}
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
                {layerVisibility.ikkeRelevant && (
                  <SymbologyBox status={"ikkeRelevant"} label="Ikke relevant" />
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      <div className={styles.rightColumn}>
        <div className={styles.columnContent}>
          {locationClickedInfo != null && (
            <Card className={styles.mapControlCard}>
              <div className={styles.featureInfoContainer}>
                <div className={styles.featureInfoHeader}>
                  <Heading level={3} data-size="xs">
                    Informasjon
                  </Heading>

                  <Button onClick={onFeatureInfoClose} variant="tertiary">
                    <XMarkIcon></XMarkIcon>
                  </Button>
                </div>
                <HeightSection position={locationClickedInfo.coordinate} />
                <Details defaultOpen>
                  <Details.Summary>Koordinater</Details.Summary>
                  <Details.Content>
                    <Heading level={4} data-size="2xs">
                      Koordinater:
                    </Heading>
                    <div>
                      Ø: {locationClickedInfo.coordinate[0].toFixed(2)}, N:{" "}
                      {locationClickedInfo.coordinate[1].toFixed(2)}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Ø: ${locationClickedInfo.coordinate[0].toFixed(2)}, N: ${locationClickedInfo.coordinate[1].toFixed(2)}`,
                        );
                      }}
                    >
                      <FilesIcon />
                      Kopièr koordinatene
                    </Button>
                  </Details.Content>
                </Details>
                {locationClickedInfo.featureInfoResults.length > 0 && (
                  <Details defaultOpen>
                    <Details.Summary>Objektinformasjon</Details.Summary>
                    <Details.Content>
                      <FeatureInfoContent
                        featureInfos={locationClickedInfo.featureInfoResults}
                        kommunerByNummer={kommunerByNummer}
                      />
                    </Details.Content>
                  </Details>
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
