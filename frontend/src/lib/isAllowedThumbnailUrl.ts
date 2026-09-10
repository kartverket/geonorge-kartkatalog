const ALLOWED_THUMBNAIL_HOSTS = new Set([
  "editor.geonorge.no",
  "editor.test.geonorge.no",
]);

export function isAllowedThumbnailUrl(
  url: string | null | undefined,
): url is string {
  if (!url) {
    return false;
  }

  if (url.startsWith("/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === "https:" &&
      ALLOWED_THUMBNAIL_HOSTS.has(parsedUrl.hostname) &&
      parsedUrl.pathname.startsWith("/thumbnails/")
    );
  } catch {
    return false;
  }
}
