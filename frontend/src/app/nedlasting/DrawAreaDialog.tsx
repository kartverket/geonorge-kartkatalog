"use client";

import { Button, Dialog, Heading, Paragraph } from "@kv-designsystem/react";
import { Polygon } from "ol/geom";
import Draw, { type DrawEvent } from "ol/interaction/Draw";
import Modify, { type ModifyEvent } from "ol/interaction/Modify";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import { useEffect, useMemo, useRef, useState } from "react";
import MapComponent from "@/app/_components/MapComponent/MapComponent";
import styles from "./DrawAreaDialog.module.css";

// TODO: avklar reell arealgrense med nedlastings-API (GN-xxx).
// Placeholder inntil da, kun for å unngå å love nedlasting av enorme arealer.
const MAX_AREA_M2_PLACEHOLDER = 50_000_000; // 50 km²

type DrawAreaDialogProps = {
  open: boolean;
  onCloseAction: () => void;
  onConfirmAction: (coordinates: string) => void;
};

function polygonToCoordinateString(polygon: Polygon): string {
  const [ring] = polygon.getCoordinates();
  return ring.flat().join(" ");
}

export function DrawAreaDialog({
  open,
  onCloseAction,
  onConfirmAction,
}: DrawAreaDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [areaM2, setAreaM2] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<string | null>(null);

  const vectorSource = useMemo(() => new VectorSource(), []);
  const vectorLayer = useMemo(
    () =>
      new VectorLayer({
        source: vectorSource,
        style: new Style({
          fill: new Fill({ color: "rgba(0, 96, 190, 0.2)" }),
          stroke: new Stroke({ color: "#0060be", width: 2 }),
        }),
      }),
    [vectorSource],
  );
  const draw = useMemo(
    () => new Draw({ source: vectorSource, type: "Polygon" }),
    [vectorSource],
  );
  const modify = useMemo(
    () => new Modify({ source: vectorSource }),
    [vectorSource],
  );

  useEffect(() => {
    if (!open) {
      vectorSource.clear();
      setAreaM2(null);
      setCoordinates(null);
    }
  }, [open, vectorSource]);

  useEffect(() => {
    const updateFromGeometry = (geometry: Polygon) => {
      setAreaM2(geometry.getArea());
      setCoordinates(polygonToCoordinateString(geometry));
    };

    const handleDrawStart = () => {
      vectorSource.clear();
      setAreaM2(null);
      setCoordinates(null);
    };

    const handleDrawEnd = (event: DrawEvent) => {
      const geometry = event.feature.getGeometry();
      if (geometry instanceof Polygon) updateFromGeometry(geometry);
    };

    const handleModifyEnd = (event: ModifyEvent) => {
      const geometry = event.features.item(0)?.getGeometry();
      if (geometry instanceof Polygon) updateFromGeometry(geometry);
    };

    draw.on("drawstart", handleDrawStart);
    draw.on("drawend", handleDrawEnd);
    modify.on("modifyend", handleModifyEnd);

    return () => {
      draw.un("drawstart", handleDrawStart);
      draw.un("drawend", handleDrawEnd);
      modify.un("modifyend", handleModifyEnd);
    };
  }, [draw, modify, vectorSource]);

  const isTooLarge = areaM2 !== null && areaM2 > MAX_AREA_M2_PLACEHOLDER;

  const interactions = useMemo(() => [draw, modify], [draw, modify]);

  return (
    <Dialog open={open} onClose={onCloseAction}>
      <Dialog.Block>
        <Heading level={2} data-size="xs">
          Tegn område på kart
        </Heading>
        <Paragraph>
          Tegn en polygon i kartet for å velge et egendefinert
          nedlastingsområde.
        </Paragraph>
      </Dialog.Block>
      <Dialog.Block className={styles.mapBlock}>
        <div className={styles.mapContainer} ref={componentRef}>
          {open ? (
            <MapComponent
              backgroundLayerName="topograyscale"
              layers={[vectorLayer]}
              interactions={interactions}
              controls={["scale", "movement"]}
              fullScreenElementRef={componentRef}
            />
          ) : null}
        </div>
        {areaM2 !== null ? (
          <Paragraph data-size="sm">
            Valgt areal: {(areaM2 / 1_000_000).toFixed(1)} km²
            {isTooLarge ? (
              <span className={styles.areaWarning}>
                {" "}
                Området er for stort til å laste ned, vennligst velg mindre
                område.
              </span>
            ) : null}
          </Paragraph>
        ) : null}
      </Dialog.Block>
      <Dialog.Block>
        <div className={styles.buttonRow}>
          <Button type="button" variant="secondary" onClick={onCloseAction}>
            Avbryt
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!coordinates || isTooLarge}
            onClick={() => {
              if (coordinates) onConfirmAction(coordinates);
            }}
          >
            Bruk dette området
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  );
}
