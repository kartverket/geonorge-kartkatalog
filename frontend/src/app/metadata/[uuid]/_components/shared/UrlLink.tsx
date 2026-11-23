import { CopyButton } from "@/app/metadata/[uuid]/_components/CopyButton";
import styles from "@/app/metadata/[uuid]/_components/ProductTabs.module.css";

export function UrlLink({
  url,
  protocol,
  protocolName,
  format,
  urlLabel,
}: {
  url: string;
  protocol: string | null;
  protocolName: string | null;
  format: string;
  urlLabel: string;
}) {
  return (
    <div className={styles.urlBox}>
      <span className={styles.urlValue}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.urlText}
        >
          {url}
        </a>
      </span>
      <CopyButton
        url={url}
        className={styles.copyButton}
        eventName="copy-distribution-link-from-accordion-content"
        trackingProperties={{
          protocol,
          protocolName,
          format,
          urlLabel,
        }}
      />
    </div>
  );
}
