"use client";

import { Button } from "@kv-designsystem/react";
import { ArrowUpIcon } from "@navikt/aksel-icons";
import { Suspense } from "react";
import { FacetSidebar } from "../FacetSidebar/FacetSidebar";
import styles from "./Sidebar.module.css";
import type { SearchResult } from "@/lib/schemas/search";

export const Sidebar = ({ facets }: { facets: SearchResult["facets"] }) => {
    const onUpButtonClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

  return (
    <Suspense fallback={null}>
      <div className={styles.sidebarWrapper}>
        <FacetSidebar facets={facets} />
        <Button
          variant="tertiary"
          data-color="info"
          className={styles.toTopButton}
          onClick={onUpButtonClick}
        >
          <ArrowUpIcon aria-hidden />
          Til toppen
        </Button>
      </div>
    </Suspense>
  );
};
