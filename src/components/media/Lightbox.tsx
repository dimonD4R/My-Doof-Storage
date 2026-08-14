import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "../../types";
import { useApp } from "../../state/AppStore";
import { mediaUrls } from "../../data/mediaUrlResolver";
import { startDownload } from "../../lib/downloads";
import { formatDate, formatTime } from "../../utils/date";
import { AddToCollectionDialog } from "../collections/AddToCollectionDialog";
import { ShareModal } from "../sharing/ShareModal";
import { Chip, IconButton } from "../ui";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconExternal,
  IconFilm,
  IconHeart,
  IconHeartFill,
  IconInfo,
  IconMaximize,
  IconPause,
  IconPlay,
  IconPlus,
  IconShare,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "../ui/icons";
import { cn } from "../../utils/cn";

export function Lightbox() {
  const { lightbox } = useApp();
  if (!lightbox) return null;
  return <LightboxInner />;
}

function LightboxInner() {
  const {
    lightbox,
    closeLightbox,
    lightboxPrev,
    lightboxNext,
    toggleFavorite,
    favorites,
    toast,
    archive,
  } = useApp();
  if (!lightbox) return null;

  const items = lightbox.items;
  const index = lightbox.index;
  const media = items[index];
  const config = archive?.repository;

  const [zoom, setZoom] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const url = config && media ? mediaUrls(config, media) : null;
  const fav = media ? favorites.has(media.id) : false;

  useEffect(() => {
    setZoom(1);
    setPlaying(false);
  }, [media?.id]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
      else if (e.key.toLowerCase() === "d") {
        if (url && media) {
          void startDownload(media.hasVideo ? url.video : url.image, url.fileName).catch(() => toast(`Couldn't download ${url.fileName}`, "error"));
        }
      } else if (e.key === " ") {
        e.preventDefault();
        if (media?.hasVideo) toggleVideo();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [closeLightbox, lightboxPrev, lightboxNext, url, media?.hasVideo]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onKey]);

  const toggleVideo = () => {
    const v = containerRef.current?.querySelector("video") as HTMLVideoElement | null;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => undefined);
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const goFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen().catch(() => undefined);
    }
  };

  const onDownload = () => {
    if (!url || !media) return;
    void startDownload(media.hasVideo ? url.video : url.image, url.fileName).catch(() => toast(`Couldn't download ${url.fileName}`, "error"));
  };

  const swipeX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    swipeX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeX.current;
    if (Math.abs(dx) > 70) {
      if (dx < 0) lightboxNext();
      else lightboxPrev();
    }
  };

  const zoomBy = (factor: number) => {
    setZoom((z) => Math.min(3.5, Math.max(1, z * factor)));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[#0b0b09]/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Memory ${index + 1} of ${items.length}`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 sm:px-5">
        <IconButton label="Close" onClick={closeLightbox} className="text-white/80 hover:bg-white/10 hover:text-white">
          <IconX width={20} height={20} />
        </IconButton>
        <span className="ml-1 text-[12px] tabular-nums text-white/55">
          {index + 1} / {items.length}
        </span>
        <div className="flex-1" />
        <IconButton label="Add to collection" onClick={() => setPickerOpen(true)} className="text-white/80 hover:bg-white/10 hover:text-white">
          <IconPlus width={18} height={18} />
        </IconButton>
        <IconButton label="Share" onClick={() => setShareOpen(true)} className="text-white/80 hover:bg-white/10 hover:text-white">
          <IconShare width={18} height={18} />
        </IconButton>
        <IconButton
          label="Download"
          onClick={onDownload}
          className={url ? "text-white/80 hover:bg-white/10 hover:text-white" : "opacity-30 pointer-events-none"}
        >
          <IconDownload width={18} height={18} />
        </IconButton>
        <IconButton
          label="Open original"
          onClick={() => url && window.open(url.github, "_blank")}
          className={url ? "text-white/80 hover:bg-white/10 hover:text-white" : "opacity-30 pointer-events-none"}
        >
          <IconExternal width={18} height={18} />
        </IconButton>
        <span className={cn("hidden sm:block", zoom > 1 && "text-white/40")} />
        <IconButton
          label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={() => media && toggleFavorite(media.id)}
          className="text-white/80 hover:bg-white/10"
        >
          {fav ? <IconHeartFill width={19} height={19} className="anim-heart text-red-400" /> : <IconHeart width={19} height={19} />}
        </IconButton>
        <IconButton
          label={detailsOpen ? "Hide details" : "View details"}
          onClick={() => setDetailsOpen((v) => !v)}
          active={detailsOpen}
          className="text-white/80 hover:bg-white/10"
        >
          <IconInfo width={19} height={19} />
        </IconButton>
        <IconButton label="Fullscreen" onClick={goFullscreen} className="hidden text-white/80 hover:bg-white/10 sm:inline-flex">
          <IconMaximize width={18} height={18} />
        </IconButton>
      </div>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {items.length > 1 && (
          <button
            aria-label="Previous memory"
            onClick={lightboxPrev}
            className="absolute left-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
          >
            <IconChevronLeft width={22} height={22} />
          </button>
        )}
        {items.length > 1 && (
          <button
            aria-label="Next memory"
            onClick={lightboxNext}
            className="absolute right-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
          >
            <IconChevronRight width={22} height={22} />
          </button>
        )}

        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-2 pb-4 pt-2 sm:px-14"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {media?.hasImage && url ? (
            <img
              src={url.image}
              alt={media.title}
              onWheel={(e) => {
                if (zoom === 1) return;
                e.preventDefault();
                zoomBy(e.deltaY < 0 ? 1.15 : 0.88);
              }}
              className="max-h-full max-w-full select-none object-contain shadow-float transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, cursor: zoom === 1 ? "zoom-in" : "zoom-out" }}
              onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              draggable={false}
            />
          ) : media?.hasVideo && url ? (
            <video
              src={url.video}
              controls
              autoPlay={false}
              playsInline
              className="max-h-full max-w-full rounded-lg shadow-float"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <IconFilm width={40} height={40} />
              <span className="text-sm">Media unavailable</span>
            </div>
          )}
        </div>

        {/* Details panel */}
        {detailsOpen && media && (
          <aside className="absolute inset-y-0 right-0 z-30 w-[320px] max-w-[90vw] overflow-y-auto border-l border-white/10 bg-black/70 p-5 backdrop-blur-md anim-fade-in">
            <DetailsPanel media={media} />
          </aside>
        )}
      </div>

      {/* Bottom caption */}
      {media && (
        <div className="flex h-16 shrink-0 items-center gap-4 px-4 pb-[env(safe-area-inset-bottom)] sm:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{media.category}</p>
            <p className="truncate text-[12px] text-white/55">
              {media.subcategories[0] && `${media.subcategories[0]} · `}
              {formatDate(media.date)}
              {formatTime(media.date) && ` · ${formatTime(media.date)}`}
            </p>
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            {media.people.map((p) => (
              <Chip key={p} className="pointer-events-none border-white/15 bg-white/5 text-white/70">
                {p}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-1 sm:right-8">
        <FloatingButton label="Zoom out" disabled={zoom === 1} onClick={() => zoomBy(0.82)}>
          <IconZoomOut width={17} height={17} />
        </FloatingButton>
        <FloatingButton label="Zoom in" disabled={zoom >= 3.5} onClick={() => zoomBy(1.25)}>
          <IconZoomIn width={17} height={17} />
        </FloatingButton>
        {media?.hasVideo && (
          <FloatingButton label={playing ? "Pause" : "Play"} onClick={toggleVideo}>
            {playing ? <IconPause width={17} height={17} /> : <IconPlay width={17} height={17} />}
          </FloatingButton>
        )}
      </div>

      {/* Add-to-collection / share dialogs */}
      {pickerOpen && media && (
        <AddToCollectionDialog
          mediaList={[media]}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {shareOpen && media && (
        <ShareModal
          kind="collection"
          targetId={media.id}
          name={media.title}
          about={`${media.category}${media.subcategories[0] ? ` · ${media.subcategories[0]}` : ""}`}
          media={[media]}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}

function DetailsPanel({ media }: { media: MediaItem }) {
  return (
    <div className="space-y-5 text-white">
      <div>
        <h3 className="font-display text-[19px] leading-snug text-white">{media.title}</h3>
        <p className="mt-0.5 text-[12px] text-white/50">
          {formatDate(media.date)}
          {formatTime(media.date) && ` · ${formatTime(media.date)}`}
        </p>
      </div>

      <Row label="Category">{media.category}</Row>
      <Row label="Subcategories">
        {media.subcategories.length ? media.subcategories.join(", ") : "—"}
      </Row>
      <Row label="Media type">{media.hasVideo ? "Video" : media.hasImage ? "Photo" : "None"}</Row>
      <Row label="File">{media.fileName}</Row>
      <Row label="Date (ISO)">{media.dateISO || "—"}</Row>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Keywords</p>
        <div className="flex flex-wrap gap-1.5">
          {media.keywords.map((k) => (
            <Chip key={k} className="pointer-events-none border-white/15 bg-white/5 text-white/70">{k}</Chip>
          ))}
          {media.keywords.length === 0 && <span className="text-[12px] text-white/40">—</span>}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">People</p>
        <div className="flex flex-wrap gap-1.5">
          {media.people.map((p) => (
            <Chip key={p} className="pointer-events-none border-white/15 bg-white/5 text-white/70">{p}</Chip>
          ))}
          {media.people.length === 0 && <span className="text-[12px] text-white/40">—</span>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-0.5 text-[13px] text-white/85">{children}</p>
    </div>
  );
}

function FloatingButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/75 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}