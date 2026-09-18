"use client";

import { Button } from "@kv-designsystem/react";
import { ArrowUpIcon } from "@navikt/aksel-icons";

export const ToTopButton = () => {
  const onUpButtonClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Button variant="tertiary" data-color="info" onClick={onUpButtonClick}>
      <ArrowUpIcon aria-hidden />
      Til toppen
    </Button>
  );
};
