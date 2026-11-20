"use client";

import { Button } from "@kv-designsystem/react";
import { ArrowUpIcon } from "@navikt/aksel-icons";
import { useDictionary } from "@/components/I18nProvider";

export const ToTopButton = () => {
  const t = useDictionary().searchResults;
  const onUpButtonClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Button variant="tertiary" data-color="info" onClick={onUpButtonClick}>
      <ArrowUpIcon aria-hidden />
      {t.toTop}
    </Button>
  );
};
