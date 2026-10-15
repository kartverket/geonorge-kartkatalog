"use client";

import ScaleLine from "ol/control/ScaleLine";
import type { Coordinate } from "ol/coordinate";
import type BaseEvent from "ol/events/Event";
import type BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import MapBrowserEvent from "ol/MapBrowserEvent";
import TileWMS from "ol/source/TileWMS";
import { useCallback, useEffect, useRef } from "react";
import convert from "xml-js";
import {
  type FeatureInfoResult,
  type FeatureInfoResults,
  parseFeatureInfoResult,
} from "@/lib/schemas/feature-info";
import styles from "./Content.module.css";
import { MapOverlay } from "./MapOverlay";
import { type BackgroundLayerName, getBackgroundLayer } from "./map/layers";
import { map } from "./map/map";

export type MapControls = "scale" | "movement";

export type FeatureInfo = {
  layerId: string | undefined;
  result: FeatureInfoResult;
};

export interface MapComponentProps {
  backgroundLayerName: BackgroundLayerName;
  layers?: BaseLayer[];
  controls?: MapControls[];
  fullScreenElementRef?: React.RefObject<HTMLElement | null>;
  onFeatureInfoResultsChange?: (
    results: FeatureInfo[],
    locationClicked: Coordinate,
  ) => void;
  onClick?: (event: Event | BaseEvent) => void;
}

const getFeatureInfo = async (
  url: string,
): Promise<FeatureInfoResults[number]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch feature info: ${response.statusText}`);
    }
    const text = await response.text();
    const converted = convert.xml2js(text, {
      compact: true,
      ignoreComment: true,
    });
    return parseFeatureInfoResult(converted);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const Content = (props: MapComponentProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  const mapOnClick = useCallback(
    (event: Event | BaseEvent) => {
      if (props.onClick) {
        props.onClick(event);
      }

      if (!(event instanceof MapBrowserEvent)) return;
      const currentResolution = map.getView().getResolution();
      if (currentResolution === undefined) return;
      const currentProjection = map.getView().getProjection();

      const currentLayers = map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getVisible());

      const featureInfoUrls = currentLayers
        .map((layer) => {
          if (layer instanceof VectorLayer || layer instanceof TileLayer) {
            console.log(layer.getProperties().id);
            const source = layer.getSource();
            if (source instanceof TileWMS) {
              const url = source.getFeatureInfoUrl(
                event.coordinate,
                currentResolution,
                currentProjection.getCode(),
                { INFO_FORMAT: "application/vnd.ogc.gml" },
              );
              if (url == null) return null;
              return {
                url: url,
                id: layer.getProperties().id as string | undefined,
              };
            }
          }
          return null;
        })
        .filter((r) => r?.url != null)
        .filter((r) => r != null);
      const featureInfoPromises = featureInfoUrls.map(({ url, id }) =>
        getFeatureInfo(url).then((result) => ({ result, layerId: id })),
      );
      const featureInfoResults = Promise.all(featureInfoPromises);
      featureInfoResults.then((results) => {
        if (props.onFeatureInfoResultsChange) {
          const resultsWithData = results.filter(
            (r) => r.result != null,
          ) as FeatureInfo[];
          props.onFeatureInfoResultsChange(resultsWithData, event.coordinate);
        }
      });
    },
    [props.onClick, props.onFeatureInfoResultsChange],
  );

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    map.setTarget(target);
    map.addEventListener("singleclick", mapOnClick);
    return () => {
      map.setTarget(undefined);
      map.removeEventListener("singleclick", mapOnClick);
    };
  }, [mapOnClick]);

  useEffect(() => {
    let cancelled = false;
    let backgroundLayer: BaseLayer | undefined;

    const loadBackgroundLayer = async () => {
      try {
        const layer = await getBackgroundLayer(
          props.backgroundLayerName,
          "EPSG:25833",
        );
        if (layer && !cancelled) {
          backgroundLayer = layer;
          map.addLayer(layer);
        }
      } catch (error) {
        if (!cancelled)
          console.error("Failed to load background layer:", error);
      }
    };
    void loadBackgroundLayer();

    return () => {
      cancelled = true;
      if (backgroundLayer) map.removeLayer(backgroundLayer);
    };
  }, [props.backgroundLayerName]);

  useEffect(() => {
    props.layers?.forEach((layer, index) => {
      layer.setZIndex(index + 1);
      map.addLayer(layer);
    });
    return () => {
      props.layers?.forEach((layer) => {
        map.removeLayer(layer);
      });
    };
  }, [props.layers]);

  useEffect(() => {
    if (props.controls?.includes("scale")) {
      map.getControls().forEach((control) => {
        if (control instanceof ScaleLine) {
          map.removeControl(control);
        }
      });
      map.addControl(
        new ScaleLine({
          units: "metric",
        }),
      );

      return () => {
        map.getControls().forEach((control) => {
          if (control instanceof ScaleLine) {
            map.removeControl(control);
          }
        });
      };
    }
  }, [props.controls]);

  return (
    <div className={styles.container}>
      <MapOverlay
        showMovementControls={props.controls?.includes("movement")}
        fullScreenElementRef={props.fullScreenElementRef}
      />
      <div id="map-content" ref={targetRef} className={styles.map} />
    </div>
  );
};

export default Content;
