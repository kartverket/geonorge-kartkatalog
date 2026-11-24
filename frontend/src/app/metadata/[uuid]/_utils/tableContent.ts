import type { ReactNode } from "react";
import type { Field } from "@/app/metadata/[uuid]/_components/shared/FieldList";

const hasContent = (content: ReactNode) =>
  content !== null &&
  content !== undefined &&
  content !== false &&
  content !== "";

export function getVisibleFields(fields: Field[]): Field[] {
  return fields.filter((f) => hasContent(f.content));
}

export function hasVisibleFields(fields: Field[]): boolean {
  return getVisibleFields(fields).length > 0;
}
