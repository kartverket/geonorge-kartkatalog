"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MapComponent = () => {
  const MapContentDynamic = dynamic(() => import("./Content"), {
    ssr: false,
  });
  return (
    <Suspense fallback={<p>Laster kartet...</p>}>
      <MapContentDynamic backgroundLayerName="topograyscale" />
    </Suspense>
  );
};

export default MapComponent;
