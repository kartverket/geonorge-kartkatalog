import { Tag } from "@kv-designsystem/react";
import type { ReactNode } from "react";
import styles from "./RequiredTag.module.css";

/** Tag ved label for påkrevde felt. Skjules når feltet er fylt ut, men tar fortsatt plass. */
export function RequiredTag({
  hidden,
  children,
}: {
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <Tag
      data-color="warning"
      className={`${styles.requiredTag} ${hidden ? styles.hidden : ""}`}
    >
      {children}
    </Tag>
  );
}
