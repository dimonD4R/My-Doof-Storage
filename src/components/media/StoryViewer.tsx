import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "../../types";
import { useApp } from "../../state/AppStore";
import { mediaUrls } from "../../data/mediaUrlResolver";
import { formatDate } from "../../utils/date";
import { IconChevronLeft, IconChevronRight, IconPause, IconPlay, IconX } from "../ui/icons";

interface Props {
  items: MediaItem[];
  title?: string;
  startIndex?: number;
  onClose: () => void;
  onOpenLightbox?: (index: number) => void;
}

export function StoryViewer({ items, title, startIndex = 0, onClose, onOpenLightbox }: Props) {
  const { archive } = useApp();
  const config = archive?.repository;
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const media = items[index];
  const url = media && config ? mediaUrls(config, media) : null;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(
    (dir: 1 | -1) =>
      setIndex((i) => (dir === 1 ? (i + 1) % Math.max(items.length, 1) : (i - 1 + items.length) % Math.max(items.length, 1))),
    [items.length]
  );

  useEffect(() => {
    if (!playing || !media || media.hasVideo) return;
    timerRef.current = setTimeout(advance, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, playing, media, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") advance(-1);
      else if (e.key === "ArrowRight") advance(1);
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [advance, onClose]);

  if (!media) return null;
  const pct = ((index + 1) / Math.max(items.length, 1)) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0a0a08] text-white" role="dialog" aria-modal="true" aria-label={title ?? "Memory story"}>
      {/* progress bar */}
      <div className="h-1 w-full bg-white/10">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <button aria-label="Close story" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
          <IconX width={20} height={20} />
        </button>
        <div className="min-w-0 flex-1">
          {title && <p className="clamp-1 text-[13px] font-semibold">{title}</p>}
          <p className="text-[11.5px] text-white/50">
            {formatDate(media.date)} · {index + 1} / {items.length}
          </p>
        </div>
        {onOpenLightbox && (
          <button onClick={() => onOpenLightbox(index)} className="rounded-full bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white/85 hover:bg-white/20">
            Open detail
          </button>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
        <button aria-label="Previous" onClick={() => advance(-1)} className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 sm:left-4">
          <IconChevronLeft width={24} height={24} />
        </button>
        {media.hasImage && url ? (
          <img src={url.image} alt={media.title} className="max-h-full max-w-full object-contain shadow-float" draggable={false} />
        ) : media.hasVideo && url ? (
          <video src={url.video} controls playsInline className="max-h-full max-w-full rounded-xl" />
        ) : (
          <p className="text-white/40">Media unavailable</p>
        )}
        <button aria-label="Next" onClick={() => advance(1)} className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 sm:right-4">
          <IconChevronRight width={24} height={24} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 py-4">
        <button
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
        >
          {playing ? <IconPause width={18} height={18} /> : <IconPlay width={18} height={18} />}
        </button>
      </div>
    </div>,
    document.body
  );
}