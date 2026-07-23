"use client";
import { Button, Heading } from "@kv-designsystem/react";
import { useEffect } from "react";
import styles from "@/app/metadata/[uuid]/error.module.css";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className={styles.content}>
      <Heading>Noe gikk galt</Heading>
      <Button variant="primary" data-color="neutral" onClick={unstable_retry}>
        Last på nytt
      </Button>
    </div>
  );
}
