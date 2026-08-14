import { memo, useEffect, useRef, useState } from "react";
import type { MediaItem } from "../../types";
import { useApp } from "../../state/AppStore";
import { mediaUrl, mediaUrls, thumbUrl } from "../../data/mediaUrlResolver";
import { startDownload } from "../../lib/downloads";
import { formatDateShort } from "../../utils/date";
import { IconDownload, IconFilm, IconHeart, IconHeartFill, IconPhoto, IconPlay, IconPlus } from "../ui/icons";
import { cn } from "../../utils/cn";

interface Props {
  media: MediaItem;
  index: number;
  selected: boolean;
  selectionMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (index: number) => void;
  onAddToCollection?: (media: MediaItem) => void;
}

const MediaCardInner = memo(function MediaCard({
  media,
  index,
  selected,
  selectionMode,
  onToggleSelect,
  onOpen,
  onAddToCollection,
}: Props) {
  const { archive, favorites, toggleFavorite, toast } = useApp();
  const config = archive?.repository;
  const url = config ? mediaUrls(config, media) : null;
  const fullImg = config ? mediaUrl(config, media.imagePath) : "";
  const thumb = config ? thumbUrl(config, media.imagePath) : "";

  const [imgBroken, setImgBroken] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [useFullImg, setUseFullImg] = useState(false);
  const [videoBroken, setVideoBroken] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fav = favorites.has(media.id);

  useEffect(() => {
    setImgBroken(false);
    setImgLoaded(false);
    setUseFullImg(false);
    setVideoBroken(false);
    setDuration(null);
  }, [media.id]);

  const isVideo = media.hasVideo;

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect(media.id);
    } else {
      onOpen(index);
    }
  };

  return (
    <div
      className="group relative outline-none"
      role="button"
      tabIndex={0}
      aria-label={`Open memory: ${media.title}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card transition-shadow",
          selected
            ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-canvas"
            : "border-line group-hover:border-line-strong group-hover:shadow-card"
        )}
      >
        <div className="aspect-square w-full overflow-hidden">
          {media.hasImage && url && !imgBroken ? (
            <img
              loading="lazy"
              decoding="async"
              src={useFullImg ? fullImg : thumb}
              alt={media.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                if (!useFullImg) setUseFullImg(true);
                else setImgBroken(true);
              }}
              className={cn("h-full w-full object-cover transition-transform duration-500", imgLoaded ? "opacity-100" : "opacity-0")}
              draggable={false}
            />
          ) : isVideo && url && !videoBroken ? (
            <video
              ref={videoRef}
              src={url.video}
              preload="metadata"
              muted
              playsInline
              onLoadedMetadata={() => {
                if (videoRef.current && isFinite(videoRef.current.duration)) {
                  setDuration(videoRef.current.duration);
                }
              }}
              onError={() => setVideoBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
              {isVideo ? <IconFilm width={28} height={28} /> : <IconPhoto width={28} height={28} />}
            </div>
          )}
        </div>

        {/* Play badge */}
        {isVideo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-[2px]">
              <IconPlay width={16} height={16} className="ml-0.5" />
            </span>
          </div>
        )}
        {isVideo && duration != null && (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
            {formatDuration(duration)}
          </span>
        )}

        {/* Selection checkbox */}
        {selectionMode && (
          <span
            className={cn(
              "absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
              selected ? "border-accent bg-accent text-accent-ink" : "border-white/70 bg-black/30 text-transparent"
            )}
          >
            {selected && <CheckMark />}
          </span>
        )}

        {/* Hover actions */}
        {!selectionMode && (
          <div className="absolute inset-x-2 top-2 flex justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <CardAction label={fav ? "Remove favorite" : "Favorite"} onClick={() => toggleFavorite(media.id)}>
              {fav ? <IconHeartFill width={15} height={15} className="text-red-500" /> : <IconHeart width={15} height={15} />}
            </CardAction>
            <div className="flex gap-1">
              {onAddToCollection && (
                <CardAction
                  label="Add to collection"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCollection(media);
                  }}
                >
                  <IconPlus width={15} height={15} />
                </CardAction>
              )}
              {url && (
                <CardAction
                  label="Download"
                  onClick={(e) => {
                    e.stopPropagation();
                    void startDownload(media.hasVideo ? url.video : url.image, url.fileName).catch(() => toast(`Couldn't download ${url.fileName}`, "error"));
                  }}
                >
                  <IconDownload width={15} height={15} />
                </CardAction>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-1.5 px-0.5">
        <p className="truncate text-[12.5px] font-medium text-ink">{media.category}</p>
        <p className="truncate text-[11.5px] text-ink-3">
          {media.subcategories[0] && `${media.subcategories[0]} · `}
          {formatDateShort(media.date)}
        </p>
      </div>
    </div>
  );
});

function CardAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-[2px] transition-colors hover:bg-black/70"
    >
      {children}
    </button>
  );
}

function CheckMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const MediaCard = MediaCardInner;