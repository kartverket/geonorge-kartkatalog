"use client";

import GeoJSON from "ol/format/GeoJSON";
import type BaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useEffect, useMemo, useRef, useState } from "react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import type { Kommune } from "@/lib/schemas/kommune";
import type { ProductMetadata } from "@/lib/schemas/product";
import styles from "./Dekningskart.module.css";
import { getLayerFromCoverageData } from "./layerUtils";
import type { LocationClickedInfo } from "./overlay/DekningskartOverlay";
import { DekningskartOverlay } from "./overlay/DekningskartOverlay";
import {
  type CoverageStatus,
  getCompletenessStyleFunction,
} from "./styleFunctions";

interface CoverageLayer {
  id: string;
  label: string;
  layer: BaseLayer;
}

export interface DekningkartProps {
  metadata: ProductMetadata;
  kommunerByNummer: Record<string, Kommune>;
}

export const Dekningskart = (props: DekningkartProps) => {
  const [locationClickedInfo, setLocationClickedInfo] =
    useState<LocationClickedInfo | null>(null);
  const coverageData = props.metadata.coverageData;
  const componentRef = useRef<HTMLDivElement>(null);
  const layers = useMemo(() => {
    const result: CoverageLayer[] = [];
    if (!coverageData) return result;
    if (coverageData.coverageData) {
      const coverage = getLayerFromCoverageData(
        coverageData.coverageData,
        "coverage",
      );
      result.push({
        id: "coverage",
        label: "Dekning",
        layer: coverage,
      });
    }

    if (coverageData.coverageOverviewData) {
      const overview = getLayerFromCoverageData(
        coverageData.coverageOverviewData,
        "overview",
      );
      result.push({
        id: "overview",
        label: "Dekningsoversikt",
        layer: overview,
      });
    }

    if (coverageData.completenessCoverageData?.type === "GEOJSON") {
      const vectorSource = new VectorSource({
        url: coverageData.completenessCoverageData.url,
        format: new GeoJSON(),
      });

      const splitLayerConfig: { id: CoverageStatus; label: string }[] = [
        { id: "fullstendig", label: "Fullstendig" },
        { id: "ufullstendig", label: "Ufullstendig" },
        { id: "ikkeKartlagt", label: "Ikke kartlagt" },
      ];

      const splitLayers = splitLayerConfig.map(({ id, label }) => {
        const styleFunction = getCompletenessStyleFunction(id);
        const layer = new VectorLayer({
          source: vectorSource,
          style: styleFunction,
        });
        return {
          id,
          label,
          layer,
        };
      });
      result.push(...splitLayers);
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
    <div className={styles.container} ref={componentRef}>
      <MapComponent
        markerLocation={locationClickedInfo?.coordinate}
        backgroundLayerName="topograyscale"
        layers={mapLayers}
        controls={["scale", "movement"]}
        fullScreenElementRef={componentRef}
        onFeatureInfoResultsChange={(featureInfoResults, coordinate) => {
          setLocationClickedInfo({
            featureInfoResults,
            coordinate,
            height: 1337,
          }); //Fix height later
        }}
      />
      <DekningskartOverlay
        kommunerByNummer={props.kommunerByNummer}
        layerVisibility={layerVisibility}
        layerIds={layerIds}
        onVisibilityChange={(id, visible) =>
          setLayerVisibility((current) =>
            layerIds.includes(id) ? { ...current, [id]: visible } : current,
          )
        }
        locationClickedInfo={locationClickedInfo}
        onFeatureInfoClose={() => setLocationClickedInfo(null)}
      />
    </div>
  );
};
