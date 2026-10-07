"use client";

import {
  Card,
  Checkbox,
  Details,
  Heading,
  Label,
} from "@kv-designsystem/react";
import type BaseLayer from "ol/layer/Base";
import { useEffect, useMemo, useState } from "react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./Dekningskart.module.css";
import { getGEOJSONLayerFromUrl, getWMSLayerFromUrl } from "./utils";

interface CoverageLayer {
  id: string;
  label: string;
  layer: BaseLayer;
}

export interface DekningkartProps {
  metadata: ProductMetadata;
}

export const Dekningskart = (props: DekningkartProps) => {
  const coverageData = props.metadata.coverageData;
  const [layerVisibility, setLayerVisibility] = useState<
    Record<string, boolean>
  >({});
  const layers = useMemo(() => {
    const result: CoverageLayer[] = [];
    if (!coverageData) return result;

    if (coverageData.coverageWMSUrl?.url) {
      result.push({
        id: "coverage",
        label: "Dekning",
        layer: getWMSLayerFromUrl(coverageData.coverageWMSUrl.url, {
          LAYERS: coverageData.coverageWMSUrl.layers,
          CRS: "EPSG:25833",
        }),
      });
    }

    if (coverageData.coverageOverviewWMSUrl?.url) {
      result.push({
        id: "overview",
        label: "Dekningsoversikt",
        layer: getWMSLayerFromUrl(coverageData.coverageOverviewWMSUrl.url, {
          LAYERS: coverageData.coverageOverviewWMSUrl.layers,
          CRS: "EPSG:25833",
        }),
      });
    }

    if (coverageData.completenessCoverageWMSUrl?.url) {
      result.push({
        id: "completeness",
        label: "Fullstendighet",
        layer: getGEOJSONLayerFromUrl(
          coverageData.completenessCoverageWMSUrl.url,
        ),
      });
    }
    return result;
  }, [coverageData]);
  const mapLayers = useMemo(() => layers.map(({ layer }) => layer), [layers]);

  useEffect(() => {
    layers.forEach(({ id, layer }) => {
      layer.setVisible(layerVisibility[id] ?? true);
    });
  }, [layers, layerVisibility]);

  if (!coverageData) return null;

  return (
    <div className={styles.container}>
      <MapComponent backgroundLayerName="topograyscale" layers={mapLayers} />
      <div className={styles.overlay}>
        <div className={styles.leftColumn}>
          <div className={styles.columnContent}>
            <Card className={styles.mapSelectCard}>
              <Heading>Valg for visningen</Heading>
              <Details data-color="accent" variant="tinted">
                <Details.Summary>Se dekningskart</Details.Summary>
                <Details.Content>
                  <Label>Velg detaljeringsnivå</Label>
                  <fieldset>
                    <LayerCheckbox
                      id={"overview"}
                      label={"Kommune"}
                      layerVisibility={layerVisibility}
                      setLayerVisibility={setLayerVisibility}
                    />
                    <LayerCheckbox
                      id={"coverage"}
                      label={"Rutenett"}
                      layerVisibility={layerVisibility}
                      setLayerVisibility={setLayerVisibility}
                    />
                  </fieldset>
                </Details.Content>
              </Details>
              <Details data-color="accent" variant="tinted">
                <Details.Summary>
                  Se fullstendighetsdekningskart
                </Details.Summary>
                <Details.Content>
                  <fieldset>
                    <LayerCheckbox
                      id={"completeness"}
                      label={"Fullstendighetsdekning"}
                      layerVisibility={layerVisibility}
                      setLayerVisibility={setLayerVisibility}
                    />
                  </fieldset>
                </Details.Content>
              </Details>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayerCheckbox = ({
  id,
  label,
  layerVisibility,
  setLayerVisibility,
}: {
  id: string;
  label: string;
  layerVisibility: Record<string, boolean>;
  setLayerVisibility: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}) => {
  return (
    <Checkbox
      checked={layerVisibility[id] ?? true}
      label={label}
      onChange={(c) =>
        setLayerVisibility((current) => ({
          ...current,
          [id]: c.target.checked,
        }))
      }
    />
  );
};
