export function decodeRouteUuid(uuid: string) {
  try {
    return decodeURIComponent(uuid);
  } catch {
    return uuid;
  }
}

function cleanAlertLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getAlertDetailsUrl(
  label: string | null,
  systemId: string | null,
) {
  const registerBaseUrl = process.env.REGISTER_BASE_URL;
  if (!label || !systemId || !registerBaseUrl) return null;

  const cleanedLabel = cleanAlertLabel(label);
  if (!cleanedLabel) return null;

  return `${registerBaseUrl.replace(/\/$/, "")}/varsler/${cleanedLabel}/${encodeURIComponent(systemId)}`;
}
