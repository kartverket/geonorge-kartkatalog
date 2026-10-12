"use client";

import type BaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import { useEffect, useMemo, useState } from "react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./Dekningskart.module.css";
import { DekningskartOverlay } from "./DekningskartOverlay";
import { getLayerFromCoverageData } from "./layerUtils";
import { getCompletenessStyleFunction } from "./styleFunctions";

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
  const layers = useMemo(() => {
    const result: CoverageLayer[] = [];
    if (!coverageData) return result;
    if (coverageData.coverageData) {
      const coverage = getLayerFromCoverageData(coverageData.coverageData);
      result.push({
        id: "coverage",
        label: "Dekning",
        layer: coverage,
      });
    }

    if (coverageData.coverageOverviewData) {
      const overview = getLayerFromCoverageData(
        coverageData.coverageOverviewData,
      );
      result.push({
        id: "overview",
        label: "Dekningsoversikt",
        layer: overview,
      });
    }

    if (coverageData.completenessCoverageData) {
      const completenessOverview = getLayerFromCoverageData(
        coverageData.completenessCoverageData,
      );

      if (completenessOverview instanceof VectorLayer) {
        const fullstendigStyleFunction =
          getCompletenessStyleFunction("fullstendig");

        const fullstendigLayer = new VectorLayer({
          source: completenessOverview.getSource(),
          style: fullstendigStyleFunction,
        });

        const ufullstendigStyleFunction =
          getCompletenessStyleFunction("ufullstendig");

        const ufullstendigLayer = new VectorLayer({
          source: completenessOverview.getSource(),
          style: ufullstendigStyleFunction,
        });

        const ikkeKartlagtStyleFunction =
          getCompletenessStyleFunction("ikkeKartlagt");

        const ikkeKartlagtLayer = new VectorLayer({
          source: completenessOverview.getSource(),
          style: ikkeKartlagtStyleFunction,
        });

        result.push({
          id: "ikkeKartlagt",
          label: "Ikke kartlagt",
          layer: ikkeKartlagtLayer,
        });
        result.push({
          id: "ufullstendig",
          label: "Ufullstendig",
          layer: ufullstendigLayer,
        });
        result.push({
          id: "fullstendig",
          label: "Fullstendig",
          layer: fullstendigLayer,
        });
      } else {
        console.warn(
          "completenessOverview is not an instance of VectorLayer. Should not happen, but adding as fallback",
        );
        result.push({
          id: "fullstendig",
          label: "Fullstendighet",
          layer: completenessOverview,
        });
      }
    }
    return result;
  }, [coverageData]);
  const [layerVisibility, setLayerVisibility] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(layers.map(({ id }) => [id, true])));
  const mapLayers = useMemo(() => layers.map(({ layer }) => layer), [layers]);
  const layerIds = useMemo(() => layers.map(({ id }) => id), [layers]);

  useEffect(() => {
    layers.forEach(({ id, layer }) => {
      layer.setVisible(layerVisibility[id] ?? true);
    });
  }, [layers, layerVisibility]);

  if (!coverageData) return null;

  return (
    <div className={styles.container}>
      <MapComponent
        backgroundLayerName="topograyscale"
        layers={mapLayers}
        controls={["scale"]}
      />
      <DekningskartOverlay
        metadata={props.metadata}
        layerVisibility={layerVisibility}
        layerIds={layerIds}
        onVisibilityChange={(id, visible) =>
          setLayerVisibility((current) =>
            layerIds.includes(id) ? { ...current, [id]: visible } : current,
          )
        }
      />
    </div>
  );
};
