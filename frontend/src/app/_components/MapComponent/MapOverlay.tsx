"use client";

import { Button, Card } from "@kv-designsystem/react";
import {
  CompassIcon,
  ExpandIcon,
  MinusIcon,
  PlusIcon,
  ShrinkIcon,
} from "@navikt/aksel-icons";
import { transform } from "ol/proj";
import { useEffect, useState } from "react";
import styles from "./MapOverlay.module.css";
import { map } from "./map/map";

export type MapOverlayProps = {
  showMovementControls?: boolean;
  fullScreenElementRef?: React.RefObject<HTMLElement | null>;
};

const zoomTo = (zoomLevel: number) => {
  const view = map.getView();
  const currentZoom = view.getZoom();
  if (currentZoom === undefined) {
    return;
  }

  view.animate({
    zoom: zoomLevel,
    duration: 100,
  });
};

const onZoomIn = () => {
  const currentLevel = map.getView().getZoom();
  if (currentLevel === undefined) {
    return;
  }
  zoomTo(currentLevel + 1);
};

const onZoomOut = () => {
  const currentLevel = map.getView().getZoom();
  if (currentLevel === undefined) {
    return;
  }
  zoomTo(currentLevel - 1);
};

const onShowMyLocation = () => {
  const view = map.getView();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      const currentProjection = view.getProjection();
      const [x, y] = transform(
        [longitude, latitude],
        "EPSG:4326",
        currentProjection,
      );

      view.animate({
        center: [x, y],
        zoom: 15,
        duration: 500,
      });
    });
  }
};

const ControlButton = ({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
}) => (
  <Button
    variant="secondary"
    data-color="accent"
    className={styles.controlButton}
    onClick={onClick}
  >
    {icon}
  </Button>
);

export const MapOverlay = (props: MapOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "F11") {
        event.preventDefault();
        event.stopPropagation();
        setIsFullscreen(!isFullscreen);
      }
    });
    return () => {
      document.removeEventListener("keydown", (event) => {
        if (event.key === "F11") {
          event.preventDefault();
          event.stopPropagation();
          setIsFullscreen(!isFullscreen);
        }
      });
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    if (isFullscreen) {
      const elem =
        props.fullScreenElementRef?.current ?? map.getTargetElement();
      if (elem && !document.fullscreenElement) {
        elem.requestFullscreen().catch((err) => {
          console.warn(
            `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
          );
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn(
            `Error attempting to exit full-screen mode: ${err.message} (${err.name})`,
          );
        });
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, props.fullScreenElementRef?.current]);

  return (
    <div className={styles.mapOverlay}>
      <div className={styles.middleColumn}>
        {props.showMovementControls && (
          <Card className={styles.movementControls}>
            <ControlButton icon={<CompassIcon />} onClick={onShowMyLocation} />
            <div className={styles.zoomButtons}>
              <ControlButton icon={<MinusIcon />} onClick={onZoomOut} />
              <ControlButton icon={<PlusIcon />} onClick={onZoomIn} />
            </div>
            <ControlButton
              icon={isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Card>
        )}
      </div>
    </div>
  );
};
