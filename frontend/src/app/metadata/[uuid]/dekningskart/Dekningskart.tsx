"use client";

import { Button } from "@kv-designsystem/react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import type { ProductMetadata } from "@/lib/schemas/product";
import type BaseLayer from "ol/layer/Base";
import { useEffect, useMemo, useState } from "react";
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
        <footer className={styles.overlayFooter}>
          {layers.length > 0 ? (
            <fieldset className={styles.layerControls} aria-label="Kartlag">
              {layers.map(({ id, label }) => {
                const visible = layerVisibility[id] ?? true;
                return (
                  <Button
                    key={id}
                    type="button"
                    data-size="sm"
                    variant={visible ? "primary" : "secondary"}
                    aria-pressed={visible}
                    onClick={() =>
                      setLayerVisibility((current) => ({
                        ...current,
                        [id]: !(current[id] ?? true),
                      }))
                    }
                  >
                    {label}
                  </Button>
                );
              })}
            </fieldset>
          ) : null}
        </footer>
      </div>
    </div>
  );
};
