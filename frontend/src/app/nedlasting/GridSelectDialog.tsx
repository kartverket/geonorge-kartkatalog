"use client";

import { Button, Dialog, Heading, Paragraph } from "@kv-designsystem/react";
import type BaseEvent from "ol/events/Event";
import type { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import MapBrowserEvent from "ol/MapBrowserEvent";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import styles from "./DrawAreaDialog.module.css";
import {
  type GridLayerName,
  getGridLayerDataProjection,
  getGridLayerUrl,
} from "./gridLayers";

const SELECTED_STYLE = new Style({
  fill: new Fill({ color: "rgba(0, 96, 190, 0.4)" }),
  stroke: new Stroke({ color: "#0060be", width: 2 }),
});
// Fyllet er nesten usynlig, men må være der for at klikk inne i ruten skal treffe
const AVAILABLE_STYLE = new Style({
  fill: new Fill({ color: "rgba(255, 255, 255, 0.01)" }),
  stroke: new Stroke({ color: "#0060be", width: 1 }),
});
const UNAVAILABLE_STYLE = new Style({
  fill: new Fill({ color: "rgba(0, 0, 0, 0.15)" }),
  stroke: new Stroke({ color: "rgba(0, 0, 0, 0.3)", width: 1 }),
});

// Rutenummeret ligger i egenskapen "n" og er det samme som koden i områdelisten
function getCellCode(feature: FeatureLike): string {
  return String(feature.get("n"));
}

type GridSelectDialogProps = {
  layerName: GridLayerName;
  availableCodes: string[];
  selectedCodes: string[];
  onCloseAction: () => void;
  onConfirmAction: (codes: string[]) => void;
};

export function GridSelectDialog({
  layerName,
  availableCodes,
  selectedCodes,
  onCloseAction,
  onConfirmAction,
}: GridSelectDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  // Valgene i kartet lagres først når brukeren trykker «Bruk valgte ruter»
  const [draftCodes, setDraftCodes] = useState(selectedCodes);

  const vectorLayer = useMemo(
    () =>
      new VectorLayer({
        source: new VectorSource({
          url: getGridLayerUrl(layerName),
          format: new GeoJSON({
            dataProjection: getGridLayerDataProjection(layerName),
            featureProjection: "EPSG:25833",
          }),
        }),
      }),
    [layerName],
  );
  const layers = useMemo(() => [vectorLayer], [vectorLayer]);

  useEffect(() => {
    vectorLayer.setStyle((feature) => {
      const code = getCellCode(feature);
      if (draftCodes.includes(code)) return SELECTED_STYLE;
      return availableCodes.includes(code)
        ? AVAILABLE_STYLE
        : UNAVAILABLE_STYLE;
    });
  }, [vectorLayer, draftCodes, availableCodes]);

  const handleMapClick = useCallback(
    (event: Event | BaseEvent) => {
      if (!(event instanceof MapBrowserEvent)) return;
      event.map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          const code = getCellCode(feature);
          if (!availableCodes.includes(code)) return true;
          setDraftCodes((codes) =>
            codes.includes(code)
              ? codes.filter((selectedCode) => selectedCode !== code)
              : [...codes, code],
          );
          return true;
        },
        { layerFilter: (layer) => layer === vectorLayer },
      );
    },
    [availableCodes, vectorLayer],
  );

  return (
    <Dialog open onClose={onCloseAction} className={styles.dialog}>
      <Dialog.Block className={styles.titleBlock}>
        <Heading level={2} data-size="xs">
          Velg ruter fra kart
        </Heading>
        <Paragraph>
          Klikk på rutene du vil laste ned, og klikk igjen for å fjerne en rute.
          Grå ruter kan ikke velges.
        </Paragraph>
      </Dialog.Block>
      <Dialog.Block className={styles.mapBlock}>
        <div className={styles.mapContainer} ref={componentRef}>
          <MapComponent
            backgroundLayerName="topograyscale"
            layers={layers}
            onClick={handleMapClick}
            controls={["scale", "movement"]}
            fullScreenElementRef={componentRef}
          />
        </div>
        <Paragraph data-size="sm">
          {draftCodes.length === 1
            ? "1 rute valgt"
            : `${draftCodes.length} ruter valgt`}
        </Paragraph>
      </Dialog.Block>
      <Dialog.Block>
        <div className={styles.buttonRow}>
          <Button type="button" variant="secondary" onClick={onCloseAction}>
            Avbryt
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onConfirmAction(draftCodes)}
          >
            Bruk valgte ruter
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  );
}
