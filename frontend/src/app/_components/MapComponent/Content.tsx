"use client";

import { useEffect, useRef } from "react";
import { map } from "./map/map";
import { BackgroundLayerName, getBackgroundLayer } from "./map/layers";

export interface MapComponentProps {
  backgroundLayerName: BackgroundLayerName;
}

const Content = (props: MapComponentProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetRef.current) {
      map.setTarget(targetRef.current);
      const backgroundLayer = getBackgroundLayer(props.backgroundLayerName);
      if (backgroundLayer) {
        map.addLayer(backgroundLayer);
      }
    }
  }, [props.backgroundLayerName]);

  return <div ref={targetRef} style={{ width: "100%", height: "100%" }} />;
};

export default Content;
