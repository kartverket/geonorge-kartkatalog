"use client";

import { Suspense } from "react";
import type { SearchResult } from "@/lib/schemas/search";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import styles from "./Sidebar.module.css";
import { ToTopButton } from "./ToTopButton";

export const Sidebar = ({ facets }: { facets: SearchResult["facets"] }) => {
  return (
    <Suspense fallback={null}>
      <div className={styles.sidebarWrapper}>
        <FacetSidebar facets={facets} />

        <div className={styles.toTopButton}>
          <ToTopButton />
        </div>
      </div>
    </Suspense>
  );
};
