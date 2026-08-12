import JSZip from "jszip";
import type { DownloadReport, MediaItem } from "../types";
import { baseName } from "../data/mediaUrlResolver";

export interface DownloadTarget {
  media: MediaItem;
  /** Which file to fetch (image or video when both present). */
  which: "image" | "video";
  sortIndex: number;
}

export interface DownloadCallbacks {
  onProgress?: (percent: number) => void;
  onFileDone?: (fileName: string, ok: boolean) => void;
}

/** Helper: fetch a blob with support for computing progress when the response provides a length. */
export async function fetchBlob(
  url: string,
  onProgress?: (received: number, total: number) => void
): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (!contentLength || !res.body) return res.blob();

  const reader = res.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const copy = new Uint8Array(value.byteLength);
    copy.set(value);
    chunks.push(copy);
    received += value.length;
    onProgress?.(received, contentLength);
  }
  return new Blob(chunks, { type: res.headers.get("content-type") || undefined });
}

/** Downloads a single file directly (no zip). */
export async function downloadSingle(
  url: string,
  fileName: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const blob = await fetchBlob(url, (rec, total) =>
    onProgress?.(Math.round((rec / total) * 100))
  );
  triggerBlobDownload(blob, fileName);
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Downloads several media files, bundled into a ZIP.
 * Falls back to sequential individual downloads when blob fetch is unavailable.
 */
export async function downloadBatch(
  targets: DownloadTarget[],
  urls: (t: DownloadTarget) => { image: string; video: string; fileName: string },
  options: {
    zipName: string;
    groupDir?: string | null;
    sortByNumber?: boolean;
    callbacks?: DownloadCallbacks;
  }
): Promise<DownloadReport> {
  const zip = new JSZip();
  const root = options.groupDir ? zip.folder(safeFolder(options.groupDir))! : zip;
  const photos = root.folder("Photos")!;
  const videos = root.folder("Videos")!;

  const report: DownloadReport = { requested: targets.length, downloaded: 0, failed: 0, canceled: false, failedNames: [] };
  const sorted = [...targets].sort((a, b) => a.sortIndex - b.sortIndex);

  let done = 0;
  for (const t of sorted) {
    const u = urls(t);
    const url = t.which === "image" ? u.image : u.video;
    const fallbackName = u.fileName || (t.which === "image" ? baseName(t.media.imagePath) : baseName(t.media.videoPath));
    const name = uniquifyName(fallbackName, done);
    try {
      const blob = await fetchBlob(url);
      const folder = t.which === "image" ? photos : videos;
      folder.file(name, blob);
      report.downloaded += 1;
      options.callbacks?.onFileDone?.(name, true);
    } catch {
      report.failed += 1;
      report.failedNames.push(baseName(url));
      options.callbacks?.onFileDone?.(fallbackName, false);
    }
    done += 1;
    options.callbacks?.onProgress?.(Math.round((done / sorted.length) * 100));
  }

  try {
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "STORE",
      compressionOptions: { level: 0 },
    });
    triggerBlobDownload(blob, safeFileName(options.zipName) + ".zip");
  } catch {
    report.canceled = true;
    report.failed += report.requested - report.downloaded;
  }

  return report;
}

function uniquifyName(name: string, index: number): string {
  if (!name) return `memory_${index + 1}`;
  return name;
}

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
  return cleaned || "memories";
}

function safeFolder(name: string): string {
  return safeFileName(name).slice(0, 60);
}

export function chooseTarget(media: MediaItem, preferVideo: boolean): DownloadTarget {
  if (media.hasVideo && (preferVideo || !media.hasImage)) {
    return { media, which: "video", sortIndex: media.sourceIndex };
  }
  return { media, which: "image", sortIndex: media.sourceIndex };
}