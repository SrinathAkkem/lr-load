/** Browser-safe URL for uploads, data URIs, and absolute links. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/uploads/")) {
    return `/api/files?u=${encodeURIComponent(path)}`;
  }
  return path;
}
