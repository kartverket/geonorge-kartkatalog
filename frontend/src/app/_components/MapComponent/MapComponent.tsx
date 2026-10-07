"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { MapComponentProps } from "./Content";

import { register } from "ol/proj/proj4";
import proj4 from "proj4";

proj4.defs(
  "EPSG:25833",
  "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);
register(proj4);

const MapComponent = (props: MapComponentProps) => {
  const MapContentDynamic = dynamic(() => import("./Content"), {
    ssr: false,
  });
  return (
    <Suspense fallback={<p>Laster kartet...</p>}>
      <MapContentDynamic {...props}  />
    </Suspense>
  );
};

export default MapComponent;
