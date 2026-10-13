import { Button, Card } from "@kv-designsystem/react";
import {
  CompassIcon,
  ExpandIcon,
  MinusIcon,
  PlusIcon,
} from "@navikt/aksel-icons";
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
  const onFullScreen = () => {
    const elem = props.fullScreenElementRef?.current ?? map.getTargetElement();
    if (!elem) {
      return;
    }
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };
  return (
    <div className={styles.mapOverlay}>
      <div className={styles.middleColumn}>
        {props.showMovementControls && (
          <Card className={styles.movementControls}>
            <ControlButton icon={<CompassIcon />} />
            <div className={styles.zoomButtons}>
              <ControlButton icon={<MinusIcon />} onClick={onZoomOut} />
              <ControlButton icon={<PlusIcon />} onClick={onZoomIn} />
            </div>
            <ControlButton icon={<ExpandIcon />} onClick={onFullScreen} />
          </Card>
        )}
      </div>
    </div>
  );
};
