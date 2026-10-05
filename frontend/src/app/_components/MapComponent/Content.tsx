"use client";

import { useEffect, useRef } from "react";
import { type BackgroundLayerName, getBackgroundLayer } from "./map/layers";
import { map } from "./map/map";

export interface MapComponentProps {
  backgroundLayerName: BackgroundLayerName;
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
    const backgroundLayer = getBackgroundLayer(props.backgroundLayerName);
    if (backgroundLayer) {
      map.addLayer(backgroundLayer);
    }
    return () => {
      if (backgroundLayer) {
        map.removeLayer(backgroundLayer);
      }
    };
  }, [props.backgroundLayerName]);

  return <div ref={targetRef} style={{ width: "100%", height: "100%" }} />;
};

export default Content;
