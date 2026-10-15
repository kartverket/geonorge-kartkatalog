"use client";

import type { Coordinate } from "ol/coordinate";
import { useEffect, useState } from "react";

export const HeightSection = ({ position }: { position: Coordinate }) => {
  const [elevation, setElevation] = useState<number | null>(null);

  useEffect(() => {
    const effect = async () => {
      const url = `https://hoydedata.no/arcgis/rest/services/NHM_DTM_TOPOBATHY_25833/ImageServer/identify?f=json&geometry=${position[0]}%2C${position[1]}&geometryType=esriGeometryPoint&sr=25833&returnGeometry=false&returnCatalogItems=false`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.value == null) {
        setElevation(null);
        return;
      }
      const parsedElevation = Number(data.value);
      if (Number.isNaN(parsedElevation)) {
        setElevation(null);
        return;
      }

      setElevation(parsedElevation);
    };
    effect();
  }, [position]);

  if (elevation == null) {
    return null;
  }

  return (
    <div>
      Høyde: {elevation !== null ? elevation.toFixed(2) : "Laster..."} moh
    </div>
  );
};
