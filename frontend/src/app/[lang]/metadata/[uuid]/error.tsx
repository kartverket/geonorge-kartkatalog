"use client";

import { Button, Heading, Paragraph } from "@kv-designsystem/react";
import { ExclamationmarkTriangleFillIcon } from "@navikt/aksel-icons";
import Link from "next/link";
import { useEffect } from "react";
import styles from "@/app/[lang]/metadata/[uuid]/error.module.css";
import { useLocale } from "@/components/I18nProvider";
import { localizedPath } from "@/lib/i18n";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = useLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.content}>
      <div className={styles.titleRow}>
        <ExclamationmarkTriangleFillIcon aria-hidden className={styles.icon} />
        <Heading data-size="lg">Noe gikk galt</Heading>
      </div>
      <Paragraph>
        Vi klarte ikke å laste denne siden. Prøv igjen, eller gå tilbake til
        forsiden.
      </Paragraph>
      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={() => {
            trackClick("reload-page", LOCATIONS.MetadataPageError);
            retry();
          }}
        >
          Last på nytt
        </Button>
        <Link href={localizedPath(locale, "/")}>Tilbake til forsiden</Link>
      </div>
    </div>
  );
}
