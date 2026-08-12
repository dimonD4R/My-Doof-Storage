import type { MediaItem, RepositoryConfig } from "../types";

/** URL-encodes a relative media path segment-by-segment (preserves `/`). */
export function encodeMediaPath(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/** Raw (download/original) URL for a media path. */
export function rawUrl(config: RepositoryConfig, path: string): string {
  return config.rawBase + encodeMediaPath(path);
}

/** Media CDN URL (supports range requests for video seeking + CORS). */
export function mediaUrl(config: RepositoryConfig, path: string): string {
  return config.mediaBase + encodeMediaPath(path);
}

/**
 * Lightweight thumbnail URL for grid tiles. The images can be several MB, so we
 * resize through the Weserv images service (wsrv.nl) to a tiny WebP thumbnail.
 * Full resolution is only fetched by the Lightbox / viewers.
 */
export function thumbUrl(config: RepositoryConfig, path: string, width = 420): string {
  const src = config.mediaBase + encodeMediaPath(path);
  return `https://wsrv.nl/?url=${src}&w=${width}&q=70&output=webp`;
}

/** The GitHub blob page for opening the original file in the browser. */
export function githubFileUrl(config: RepositoryConfig, path: string): string {
  return `${config.githubUrl}/blob/${config.branch}/${encodeMediaPath(path)}`;
}

/** Base file name only (no directories). */
export function baseName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || "";
}

/** File name without extension. */
export function stemName(path: string): string {
  const base = baseName(path);
  const i = base.lastIndexOf(".");
  return i > 0 ? base.slice(0, i) : base;
}

export interface MediaUrls {
  image: string;
  video: string;
  download: string;
  github: string;
  fileName: string;
}

export function mediaUrls(config: RepositoryConfig, m: MediaItem): MediaUrls {
  return {
    image: m.hasImage ? mediaUrl(config, m.imagePath) : "",
    video: m.hasVideo ? mediaUrl(config, m.videoPath) : "",
    download: m.hasVideo
      ? rawUrl(config, m.videoPath)
      : rawUrl(config, m.imagePath),
    github: m.hasVideo
      ? githubFileUrl(config, m.videoPath)
      : githubFileUrl(config, m.imagePath),
    fileName: m.hasVideo ? baseName(m.videoPath) : baseName(m.imagePath),
  };
}

/** Kept for compatibility with dynamic resolver usage. */
export function resolveImageUrl(config: RepositoryConfig, path: string): string {
  return mediaUrl(config, path);
}

export function resolveVideoUrl(config: RepositoryConfig, path: string): string {
  return mediaUrl(config, path);
}