"use client";

import ScaleLine from "ol/control/ScaleLine";
import type BaseLayer from "ol/layer/Base";
import { useEffect, useRef } from "react";
import styles from "./Content.module.css";
import { type BackgroundLayerName, getBackgroundLayer } from "./map/layers";
import { map } from "./map/map";

export type MapControls = "scale";

export interface MapComponentProps {
  backgroundLayerName: BackgroundLayerName;
  layers?: BaseLayer[];
  controls?: MapControls[];
}

const Content = (props: MapComponentProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetRef.current) {
      map.setTarget(targetRef.current);
    }
    return () => {
      if (targetRef.current) {
        map.setTarget(null);
      }
    };
  }, []);

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
    // Example for handling map controls
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
      <div id="map-content" ref={targetRef} className={styles.map} />
    </div>
  );
};

export default Content;
