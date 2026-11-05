"use client";

import { Button, Dialog, Heading, Paragraph } from "@kv-designsystem/react";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  open: boolean;
  heading: string;
  description: string;
  confirmLabel: string;
  onConfirmAction: () => void;
  onCancelAction: () => void;
};

export function ConfirmDialog({
  open,
  heading,
  description,
  confirmLabel,
  onConfirmAction,
  onCancelAction,
}: ConfirmDialogProps) {
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
          <Button type="button" variant="secondary" onClick={onCancelAction}>
            Avbryt
          </Button>
          <Button type="button" variant="primary" onClick={onConfirmAction}>
            {confirmLabel}
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  );
}
