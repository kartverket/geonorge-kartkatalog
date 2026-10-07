"use client";

import { type BackgroundLayerName, getBackgroundLayer } from "./map/layers";
import { map } from "./map/map";
import type BaseLayer from "ol/layer/Base";
import { useEffect, useRef } from "react";
import styles from "./Content.module.css";

export interface MapComponentProps {
  backgroundLayerName: BackgroundLayerName;
  layers?: BaseLayer[];
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

  return (
    <div className={styles.container}>
      <div id="map-content" ref={targetRef} className={styles.map} />
    </div>
  );
};

export default Content;
