import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import type { MediaItem } from "../types";
import { useApp } from "../state/AppStore";
import { decodePayloadIds, decodeToken, sha256Hex } from "../lib/sharing";
import { mediaUrl, mediaUrls } from "../data/mediaUrlResolver";
import { DownloadDialog } from "../components/downloads/DownloadDialog";
import { plural } from "../utils/date";
import { formatDuration } from "../components/gallery/MediaCard";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFilm,
  IconHeart,
  IconLock,
  IconPause,
  IconPhoto,
  IconPlay,
  IconSparkles,
  IconX,
} from "../components/ui/icons";

/**
 * Public share page. Isolated from the private app: no sidebar, header, mobile
 * nav or search. Only the media referenced by the token is ever rendered.
 *
 * NOTE: this frontend-only build enforces the token's permission *flags* for
 * the recipient's experience. For true server-side access control you would
 * resolve the token on a backend (`/share/:token` → { targetId, permissions,
 * expiresAt }) and serve only the associated media. The data layer is already
 * structured so that can be plugged in without UI changes.
 */

type ShareStatus = "invalid" | "expired" | "locked" | "ready";

export function SharePage() {
  const { token = "" } = useParams();
  const { archive } = useApp();

  const payload = useMemo(() => decodeToken(token), [token]);

  const status: ShareStatus = useMemo(() => {
    if (!payload) return "invalid";
    if (payload.expiresAt && Date.now() > payload.expiresAt) return "expired";
    if (payload.passwordHash) return "locked";
    return "ready";
  }, [payload]);

  const [unlocked, setUnlocked] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [dlOpen, setDlOpen] = useState(false);

  // Dynamic Open Graph / social metadata for link previews (WhatsApp, Telegram…).
  useEffect(() => {
    if (!payload) return;
    const title = payload.name || "Shared memories";
    const desc =
      payload.description || `${payload.mediaIds.length} shared memories`;
    document.title = title;
    applyMeta("og:title", title);
    applyMeta("og:description", desc);
    applyMeta("twitter:title", title);
    applyMeta("twitter:description", desc);

    const cover = archive && archive.byId.get(Array.isArray(payload.mediaIds) ? payload.mediaIds[0] : "")?.imagePath;
    if (cover) {
      const url = mediaUrl(archive!.repository, cover);
      applyMeta("og:image", url);
      applyMeta("twitter:image", url);
    }
    return () => {
      document.title = "Your Memories";
      applyMeta("og:title", "Your Memories");
      applyMeta("og:description", "Every moment, organized beautifully.");
    };
  }, [payload, archive]);

  // ---- Resolve + permission-filter media -----------------------------------
  const allAllowed = useMemo<MediaItem[]>(() => {
    if (!archive || !payload) return [];
    const ids = decodePayloadIds(payload);
    return ids
      .map((id) => archive.byId.get(id))
      .filter((m): m is MediaItem => !!m);
  }, [archive, payload]);

  const visible = useMemo<MediaItem[]>(() => {
    if (!payload) return [];
    const perms = payload.permissions;
    return allAllowed.filter(
      (m) => (m.hasImage && perms.viewPhotos) || (m.hasVideo && perms.viewVideos)
    );
  }, [allAllowed, payload]);

  if (status === "invalid") {
    return <MessagePage title="This share link is invalid" message="It may be a broken or copied link. Ask the owner to share a fresh link." />;
  }
  if (status === "expired") {
    return <MessagePage title="This link has expired" message="The owner can create a new share link from their archive." />;
  }
  if (status === "locked" && !unlocked) {
    return (
      <PasswordGate
        name={payload!.name}
        expected={payload!.passwordHash!}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }
  if (!archive) {
    return (
      <div className="min-h-dvh bg-canvas">
        <div className="mx-auto w-full max-w-[1000px] px-4 pt-10">
          <div className="skeleton h-6 w-60 rounded-lg" />
          <div className="skeleton mt-3 h-4 w-80 rounded-md" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const photos = visible.filter((m) => m.hasImage).length;
  const videos = visible.filter((m) => m.hasVideo).length;
  const cover = visible.find((m) => m.hasImage) ?? visible[0];
  const config = archive.repository;

  const openViewer = (i: number) => setViewerIndex(i);
  const canDownload = !!payload?.permissions.downloadMedia;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* Minimal brand bar */}
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
              <IconSparkles width={15} height={15} />
            </span>
            Shared memories
          </span>
          {payload && (
            <span className="text-[11.5px] text-ink-3 tabular-nums">
              {visible.length} {visible.length === 1 ? "memory" : "memories"}
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-8">
        {/* Header */}
        {cover && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-line">
            <img
              src={mediaUrl(config, cover.imagePath)}
              alt={cover.title}
              loading="eager"
              className="h-44 w-full object-cover sm:h-64"
            />
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-display text-[28px] leading-tight text-ink sm:text-[36px]">
            {payload?.name || "Shared memories"}
          </h1>
          <p className="mt-1 text-[14px] text-ink-2">
            {payload?.description || "A selection of personal memories."}
          </p>
          <p className="mt-2 text-[12.5px] text-ink-3">
            {plural(photos, "photo")} · {plural(videos, "video")}
          </p>

          {visible.length > 0 && canDownload && (
            <button
              onClick={() => setDlOpen(true)}
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[13px] font-medium text-accent-ink transition-opacity hover:opacity-90"
            >
              <IconDownload width={15} height={15} /> Download all
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-card/50 px-6 py-16 text-center">
            <span className="text-ink-3"><IconPhoto width={30} height={30} /></span>
            <h3 className="text-[15px] font-semibold text-ink">Nothing to show</h3>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-2">
              The owner chose not to share any {!payload?.permissions.viewPhotos ? "photos" : ""}{" "}
              {!payload?.permissions.viewVideos ? "videos" : ""} in this link.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((m, i) => (
              <ShareTile
                key={m.id}
                media={m}
                configUrl={(path) => mediaUrl(config, path)}
                canDownload={canDownload}
                index={i}
                onOpen={() => openViewer(i)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Branding footer */}
      <footer className="border-t border-line py-6">
        <p className="text-center text-[12px] text-ink-3">
          Shared from <span className="font-medium text-ink-2">Your Memories</span>
        </p>
      </footer>

      {viewerIndex != null && (
        <ShareViewer
          items={visible}
          startIndex={viewerIndex}
          canDownload={canDownload}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {dlOpen && canDownload && (
        <DownloadDialog
          targets={visible.map((m, i) => ({
            media: m,
            which: m.hasImage ? "image" : "video",
            sortIndex: i,
          }))}
          zipName={payload?.name || "shared-memories"}
          groupDir={payload?.name || null}
          onClose={() => setDlOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta helpers
// ---------------------------------------------------------------------------

function applyMeta(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// ---------------------------------------------------------------------------
// Status pages
// ---------------------------------------------------------------------------

function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-card text-ink-3 shadow-card">
        <IconHeart width={24} height={24} />
      </span>
      <h1 className="font-display text-[24px] text-ink">{title}</h1>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-2">{message}</p>
      <p className="mt-8 text-[12px] text-ink-3">
        Shared from <span className="font-medium text-ink-2">Your Memories</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password gate (soft client-side gate)
// ---------------------------------------------------------------------------

function PasswordGate({
  name,
  expected,
  onUnlock,
}: {
  name: string;
  expected: string;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setChecking(true);
    const hash = await sha256Hex(value);
    setChecking(false);
    if (hash === expected) onUnlock();
    else setError(true);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 shadow-card"
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconLock width={22} height={22} />
        </span>
        <h1 className="font-display text-[22px] leading-tight text-ink">{name}</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          This collection is password protected. Enter the password to view it.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Password</span>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
            placeholder="Enter password"
          />
        </label>
        {error && (
          <p className="mt-2 text-[12.5px] text-red-600 dark:text-red-400">
            That password isn't correct. Try again.
          </p>
        )}
        <button
          type="submit"
          disabled={!value || checking}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-accent text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {checking ? "Checking…" : "Unlock"}
        </button>
      </form>
      <p className="mt-6 text-[12px] text-ink-3">
        Shared from <span className="font-medium text-ink-2">Your Memories</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tile
// ---------------------------------------------------------------------------

function ShareTile({
  media,
  configUrl,
  canDownload,
  index,
  onOpen,
}: {
  media: MediaItem;
  configUrl: (path: string) => string;
  canDownload: boolean;
  index: number;
  onOpen: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="media-tile group relative block aspect-square w-full rounded-xl border border-line bg-card"
        aria-label={`Open memory: ${media.title}`}
      >
        {media.hasImage && !broken ? (
          <img
            src={configUrl(media.imagePath)}
            alt={media.title}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : media.hasVideo && !broken ? (
          <video
            src={configUrl(media.videoPath)}
            preload="metadata"
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (isFinite(d)) setDuration(d);
            }}
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
            {media.hasVideo ? <IconFilm width={26} height={26} /> : <IconPhoto width={26} height={26} />}
          </span>
        )}

        {media.hasVideo && (
          <>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white">
                <IconPlay width={15} height={15} className="ml-0.5" />
              </span>
            </span>
            {duration != null && (
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
                {formatDuration(duration)}
              </span>
            )}
          </>
        )}

        {canDownload && (
          <span
            role="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(e) => {
              e.stopPropagation();
              const a = document.createElement("a");
              a.href = media.hasVideo ? configUrl(media.videoPath) : configUrl(media.imagePath);
              a.download = media.fileName;
              a.rel = "noreferrer";
              a.click();
            }}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <IconDownload width={15} height={15} />
          </span>
        )}
      </button>
      <p className="mt-1.5 truncate px-0.5 text-[11.5px] text-ink-2">
        {media.category}
        <span className="sr-only">, memory {index + 1}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal shared viewer
// ---------------------------------------------------------------------------

function ShareViewer({
  items,
  startIndex,
  canDownload,
  onClose,
}: {
  items: MediaItem[];
  startIndex: number;
  canDownload: boolean;
  onClose: () => void;
}) {
  const { archive } = useApp();
  const config = archive?.repository;
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const media = items[index];
  const url = media && config ? mediaUrls(config, media) : null;

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key.toLowerCase() === "d" && canDownload && url) {
        const a = document.createElement("a");
        a.href = url.download;
        a.download = url.fileName;
        a.rel = "noreferrer";
        a.click();
      } else if (e.key === " " && media?.hasVideo) {
        e.preventDefault();
        const v = document.querySelector("[data-share-video]") as HTMLVideoElement | null;
        if (v) {
          if (v.paused) void v.play();
          else v.pause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, items.length, canDownload, media?.id]);

  if (!media) return null;

  const toggleVideo = () => {
    const v = document.querySelector("[data-share-video]") as HTMLVideoElement | null;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0b0b09]/95 text-white" role="dialog" aria-modal="true" aria-label={`Memory ${index + 1} of ${items.length}`}>
      <div className="flex items-center gap-2 px-3 py-2 sm:px-5">
        <button aria-label="Close" onClick={onClose} className="flex h-9.5 w-9.5 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
          <IconX width={20} height={20} />
        </button>
        <span className="ml-1 text-[12px] tabular-nums text-white/55">
          {index + 1} / {items.length}
        </span>
        <div className="flex-1" />
        {canDownload && url && (
          <button aria-label="Download" onClick={() => {
            const a = document.createElement("a");
            a.href = url.download;
            a.download = url.fileName;
            a.rel = "noreferrer";
            a.click();
          }} className="flex h-9.5 w-9.5 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <IconDownload width={18} height={18} />
          </button>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 pt-2 sm:px-14">
        {items.length > 1 && (
          <button aria-label="Previous memory" onClick={prev} className="absolute left-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex">
            <IconChevronLeft width={22} height={22} />
          </button>
        )}
        {items.length > 1 && (
          <button aria-label="Next memory" onClick={next} className="absolute right-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex">
            <IconChevronRight width={22} height={22} />
          </button>
        )}

        {media.hasImage && url ? (
          <img src={url.image} alt={media.title} className="max-h-full max-w-full select-none object-contain shadow-float" draggable={false} />
        ) : media.hasVideo && url ? (
          <video
            data-share-video
            src={url.video}
            controls
            autoPlay
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="max-h-full max-w-full rounded-lg shadow-float"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <IconFilm width={40} height={40} />
            <span className="text-sm">Media unavailable</span>
          </div>
        )}

        {media.hasVideo && (
          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggleVideo}
            className="absolute bottom-6 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/75 sm:right-8"
          >
            {playing ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
          </button>
        )}
      </div>

      <div className="flex h-16 shrink-0 items-center gap-4 px-4 pb-[env(safe-area-inset-bottom)] sm:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{media.category}</p>
          <p className="truncate text-[12px] text-white/55">
            {media.subcategories[0] && `${media.subcategories[0]} · `}
            {media.date ? media.date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "Unknown date"}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}