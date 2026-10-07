"use client";

import { type BackgroundLayerName, getBackgroundLayer } from "./map/layers";
import { map } from "./map/map";
import type BaseLayer from "ol/layer/Base";
import { useEffect, useRef } from "react";
import styles from "./Content.module.css";

export interface MapComponentProps {
  backgroundLayerName: BackgroundLayerName;
  layers?: BaseLayer[] | undefined;
  showLayerControls?: boolean | undefined;
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

      try {
        if (!props.layers) {
          return;
        }
        props.layers.forEach((layer) => {
          const maxZIndex = Math.max(
            ...map.getAllLayers().map((l) => l.getZIndex() || 0),
          );
          layer.setZIndex(maxZIndex + 1);
          map.addLayer(layer);
        });
      } catch (error) {
        if (!cancelled)
          console.error("Failed to load additional layers:", error);
      }
    };
    void loadBackgroundLayer();

    return () => {
      cancelled = true;
      if (backgroundLayer) map.removeLayer(backgroundLayer);
      if (props.layers) {
        props.layers.forEach((layer) => {
          map.removeLayer(layer);
        });
      }
    };
  }, [props.backgroundLayerName, props.layers]);

  // useEffect(() => {
  //   if (!props.layers) {
  //     return;
  //   }
  //   props.layers.forEach((layer) => {
  //     const maxZIndex = Math.max(
  //       ...map.getAllLayers().map((l) => l.getZIndex() || 0),
  //     );
  //     layer.setZIndex(maxZIndex + 1);
  //     map.addLayer(layer);
  //   });
  //   return () => {
  //     if (props.layers) {
  //       props.layers.forEach((layer) => {
  //         map.removeLayer(layer);
  //       });
  //     }
  //   };
  // }, [props.layers]);

  return (
    <div className={styles.container}>
      <div id="map-content" ref={targetRef} className={styles.map} />
      <div id="map-overlay" className={styles.overlay} />
    </div>
  );
};

export default Content;
