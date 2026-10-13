import type { Route } from "next";
import Link from "next/link";
import styles from "./Breadcrumbs.module.css";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export default function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <nav aria-label="Brødsmulesti" className={styles.breadcrumb}>
      {segments.map((segment, index) => {
        const route = segment.href?.startsWith("/")
          ? segment.href
          : `/${segment.href}`;

        const key = `breadcrumb-${index}`;
        return (
          <span key={key}>
            {segment.href != null ? (
              <Link
                href={route as Route}
                className={index === segments.length - 1 ? styles.current : ""}
              >
                {segment.label}
              </Link>
            ) : (
              <span className={styles.current}>{segment.label}</span>
            )}
            {index < segments.length - 1 && " › "}
          </span>
        );
      })}
    </nav>
  );
}
