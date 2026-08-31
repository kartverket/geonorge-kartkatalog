"use client";

import { Skeleton } from "@kv-designsystem/react";
import styles from "@/app/metadata/[uuid]/loading.module.css";
import { isBeta } from "@/lib/basePath";

const metaFieldSkeletons = [
  {
    id: "spatial-scope",
    labelClassName: styles.metaLabelMedium,
    valueClassName: styles.metaValueShort,
  },
  {
    id: "maintenance-frequency",
    labelClassName: styles.metaLabelLong,
    valueClassName: styles.metaValueMedium,
  },
  {
    id: "updated-date",
    labelClassName: styles.metaLabelMedium,
    valueClassName: styles.metaValueShort,
  },
  {
    id: "representation",
    labelClassName: styles.metaLabelLong,
    valueClassName: styles.metaValueTag,
  },
  {
    id: "resolution-scale",
    labelClassName: styles.metaLabelShort,
    valueClassName: styles.metaValueShort,
  },
  {
    id: "fair-status",
    labelClassName: styles.metaLabelLong,
    valueClassName: styles.metaValueShort,
  },
];

export default function Loading() {
  return (
    <div className={styles.content}>
      <ProductHeaderSkeleton />
      <div className={styles.metaRow}>
        <ProductThumbnailSkeleton />
        <ProductMetaSkeleton />
      </div>
    </div>
  );
}

function ProductHeaderSkeleton() {
  return (
    <div aria-hidden className={styles.header}>
      {!isBeta && (
        <nav aria-label="Laster brødsmulesti" className={styles.breadcrumb}>
          <Skeleton className={styles.breadcrumbSkeleton}>
            Laster brødsmulesti
          </Skeleton>
        </nav>
      )}
      <Skeleton className={styles.accessSkeleton} />
      <h1 className={styles.title}>
        <Skeleton className={styles.titleSkeleton}>Laster tittel</Skeleton>
      </h1>
      <p className={styles.organization}>
        <Skeleton className={styles.organizationSkeleton}>
          Laster organisasjon
        </Skeleton>
      </p>
    </div>
  );
}

function ProductThumbnailSkeleton() {
  return <Skeleton aria-hidden className={styles.imageWrapper} />;
}

function ProductMetaSkeleton() {
  return (
    <div aria-hidden className={styles.metaGrid}>
      {metaFieldSkeletons.map(({ id, labelClassName, valueClassName }) => (
        <div className={styles.metaField} key={id}>
          <Skeleton className={labelClassName}>Laster etikett</Skeleton>
          <Skeleton className={valueClassName}>Laster verdi</Skeleton>
        </div>
      ))}

      <div className={styles.metaField}>
        <Skeleton className={styles.metaLabelLong}>Laster kategorier</Skeleton>
        <div className={styles.tagRow}>
          <Skeleton className={styles.tagShort}>Laster kategori</Skeleton>
          <Skeleton className={styles.tagMedium}>Laster kategori</Skeleton>
          <Skeleton className={styles.tagLong}>Laster kategori</Skeleton>
        </div>
      </div>

      <div className={styles.metaField}>
        <Skeleton className={styles.metaLabelShort}>Laster tema</Skeleton>
        <div className={styles.tagRow}>
          <Skeleton className={styles.tagMedium}>Laster tema</Skeleton>
          <Skeleton className={styles.tagShort}>Laster tema</Skeleton>
          <Skeleton className={styles.tagMedium}>Laster tema</Skeleton>
        </div>
      </div>

      <div className={styles.metaField}>
        <Skeleton className={styles.metaLabelMedium}>
          Laster filformater
        </Skeleton>
        <div className={styles.tagRow}>
          <Skeleton className={styles.tagShort}>Laster format</Skeleton>
          <Skeleton className={styles.tagShort}>Laster format</Skeleton>
        </div>
      </div>
    </div>
  );
}
