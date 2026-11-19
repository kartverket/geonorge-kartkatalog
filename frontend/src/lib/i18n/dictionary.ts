import type no from "@/app/[lang]/dictionaries/no.json";

/** The Norwegian dictionary is the source of truth for available keys. */
export type Dictionary = typeof no;

/** Replaces `{name}` placeholders in a dictionary string. */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
