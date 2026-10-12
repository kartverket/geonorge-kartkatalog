"use client";

import Link from "next/link";
import styles from "./BreadCrumb.module.css";

export type BreadCrumbSegment = {
  label: string;
  href?: string;
};

export interface BreadCrumbsProps {
  segments: BreadCrumbSegment[];
}

export default function BreadCrumbs({ segments }: BreadCrumbsProps) {
  return (
    <nav aria-label="Brødsmulesti" className={styles.breadcrumb}>
      {segments.map((segment, index) => (
        <span key={segment.label}>
          {segment.href != null ? (
            <Link
              href={
                segment.href.startsWith("/")
                  ? segment.href
                  : `/${segment.href}`
              }
              className={index === segments.length - 1 ? styles.current : ""}
            >
              {segment.label}
            </Link>
          ) : (
            <span className={styles.current}>{segment.label}</span>
          )}
          {index < segments.length - 1 && " › "}
        </span>
      ))}
    </nav>
  );
}
