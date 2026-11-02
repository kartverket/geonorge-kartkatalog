"use client";

import GeoJSON from "ol/format/GeoJSON";
import type BaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useEffect, useMemo, useRef, useState } from "react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import type { ProductMetadata } from "@/lib/schemas/product";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
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
  order: number;
  layer: BaseLayer;
}

export interface DekningkartProps {
  uuid: string;
  metadata: ProductMetadata;
  completenessDataString: string | null;
}

export const Dekningskart = (props: DekningkartProps) => {
  const [locationClickedInfo, setLocationClickedInfo] =
    useState<LocationClickedInfo | null>(null);
  const coverageData = props.metadata.coverageData;
  const componentRef = useRef<HTMLDivElement>(null);
  const layerConfigs = useMemo(() => {
    const result: CoverageLayer[] = [];
    if (!coverageData) return result;

    if (coverageData.coverageOverviewData) {
      const overview = getLayerFromCoverageData(
        coverageData.coverageOverviewData,
        "overview",
      );
      result.push({
        id: "overview",
        label: "Dekningsoversikt",
        order: 11,
        layer: overview,
      });
    }

    if (coverageData.coverageData) {
      const coverage = getLayerFromCoverageData(
        coverageData.coverageData,
        "coverage",
      );
      result.push({
        id: "coverage",
        label: "Dekning",
        order: 10,
        layer: coverage,
      });
    }

    if (props.completenessDataString) {
      const features = new GeoJSON().readFeatures(
        props.completenessDataString,
        {
          featureProjection: "EPSG:25833",
        },
      );

      const splitLayerConfig: { id: CoverageStatus; label: string }[] = [
        { id: "fullstendig", label: "Fullstendig" },
        { id: "ufullstendig", label: "Ufullstendig" },
        { id: "ikkeKartlagt", label: "Ikke kartlagt" },
        { id: "ikkeRelevant", label: "Ikke relevant" },
      ];

      const splitLayers = splitLayerConfig
        .map(({ id, label }, i) => {
          const styleFunction = getCompletenessStyleFunction(id);
          const featuresForLayer = features.filter(
            (feature) => feature.get("dekningsstatus") === id,
          );
          if (featuresForLayer.length === 0) return null;
          const layer = new VectorLayer({
            source: new VectorSource({
              features: featuresForLayer,
              format: new GeoJSON(),
            }),
            style: styleFunction,
          });
          return {
            id,
            label,
            order: result.length + i,
            layer,
          };
        })
        .filter((l) => l != null);
      result.push(...splitLayers);
    }

    return result.sort((a, b) => a.order - b.order);
  }, [coverageData, props.completenessDataString]);
  const [layerVisibility, setLayerVisibility] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(layerConfigs.map(({ id }) => [id, true])));
  const mapLayers = useMemo(
    () => layerConfigs.map(({ layer }) => layer),
    [layerConfigs],
  );
  const layerIds = useMemo(
    () => layerConfigs.map(({ id }) => id),
    [layerConfigs],
  );

  useEffect(() => {
    layerConfigs.forEach(({ id, layer }) => {
      layer.setVisible(layerVisibility[id] ?? false);
    });
  }, [layerConfigs, layerVisibility]);

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
          trackClick("map-location", LOCATIONS.CoverageMap, {
            hasFeatureInfo: featureInfoResults.length > 0,
          });
          setLocationClickedInfo({
            featureInfoResults,
            coordinate,
          });
        }}
      />
      <DekningskartOverlay
        metadata={props.metadata}
        layerVisibility={layerVisibility}
        layerIds={layerIds}
        onVisibilityChange={(id, visible) => {
          trackClick("toggle-layer", LOCATIONS.CoverageMap, {
            uuid: props.uuid,
            layerId: id,
            visible,
          });
          setLayerVisibility((current) =>
            layerIds.includes(id) ? { ...current, [id]: visible } : current,
          );
        }}
        locationClickedInfo={locationClickedInfo}
        onFeatureInfoClose={() => setLocationClickedInfo(null)}
      />
    </div>
  );
};
