import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilIcon,
} from "@navikt/aksel-icons";
import AddToCartButton from "@/app/_components/AddToCartButton";
import {
  getEditUrl,
  getMetadataXmlUrl,
} from "@/app/metadata/[uuid]/_utils/urls";
import type { DistributionGroup, ProductMetadata } from "@/lib/schemas/product";
import styles from "./ProductActions.module.css";


function getGeonorgeDownloadUrl(
  distributionGroups: DistributionGroup[],
): string | null {
  const group = distributionGroups.find(
    (g) => g.protocol === "GEONORGE:DOWNLOAD",
  );
  const rawUrl = group?.formats[0]?.urls[0];
  if (!rawUrl) return null;
  const stripped = rawUrl.replace(/\/+$/, "");
  const lastSlash = stripped.lastIndexOf("/");
  return lastSlash !== -1 ? stripped.substring(0, lastSlash + 1) : stripped;
}

export function ProductActions({
  metadata,
  uuid,
}: {
  metadata: ProductMetadata;
  uuid: string;
}) {
  const cartItem =
    metadata.hierarchyLevel === "dataset" && metadata.accessState === "open"
      ? {
          uuid,
          name: metadata.title,
          distributionUrl: getGeonorgeDownloadUrl(metadata.distributionGroups),
        }
      : null;

  return (
    <div className={styles.actions}>
      <AddToCartButton
        className={`ds-button ${styles.actionButton}`}
        item={cartItem}
      />
      {metadata.coverageUrl && (
        <ActionLinkButton
          href={metadata.coverageUrl}
          icon={<ExternalLinkIcon aria-hidden />}
          title="Vis dekningskart"
        />
      )}
      <ActionLinkButton
        href={getMetadataXmlUrl(uuid)}
        icon={<FileTextIcon aria-hidden />}
        title="Vis metadata XML"
      />
      {/*TODO: GN-227 håndtere at noen datasett ikke burde redigeres fra denne editUrl-en*/}
      <ActionLinkButton
        title="Rediger metadata"
        href={getEditUrl(uuid)}
        icon={<PencilIcon aria-hidden />}
      />
    </div>
  );
}

function ActionLinkButton({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <a
      data-variant="secondary"
      data-color="neutral"
      target="_blank"
      rel="noreferrer"
      href={href}
      className={`ds-button ${styles.actionButton}`}
    >
      {icon}
      {title}
    </a>
  );
}
