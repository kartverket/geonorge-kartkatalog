"use client";

import { Button, Dialog, Heading, Paragraph } from "@kv-designsystem/react";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  open: boolean;
  heading: string;
  description: string;
  cancelLabel?: string;
  onCancelAction: () => void;
  // Uten bekreft-knapp vises bare avbryt-knappen, og den blir primærknapp
  confirmLabel?: string;
  onConfirmAction?: () => void;
};

export function ConfirmDialog({
  open,
  heading,
  description,
  cancelLabel = "Avbryt",
  onCancelAction,
  confirmLabel,
  onConfirmAction,
}: ConfirmDialogProps) {
  const hasConfirm = Boolean(confirmLabel && onConfirmAction);

  return (
    <Dialog open={open} onClose={onCancelAction}>
      <Dialog.Block>
        <Heading level={2} data-size="xs">
          {heading}
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph>{description}</Paragraph>
      </Dialog.Block>
      <Dialog.Block>
        <div className={styles.buttonRow}>
          <Button
            type="button"
            variant={hasConfirm ? "secondary" : "primary"}
            onClick={onCancelAction}
          >
            {cancelLabel}
          </Button>
          {hasConfirm ? (
            <Button type="button" variant="primary" onClick={onConfirmAction}>
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </Dialog.Block>
    </Dialog>
  );
}
