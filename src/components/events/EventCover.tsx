import type { MemoryEvent } from "../../types";
import { useApp } from "../../state/AppStore";
import { thumbUrl } from "../../data/mediaUrlResolver";
import { cn } from "../../utils/cn";

/** Collage cover for an event/category using up to 4 of its media. */
export function EventCover({
  event,
  className,
  rounded = "rounded-2xl",
}: {
  event: MemoryEvent;
  className?: string;
  rounded?: string;
}) {
  const { archive } = useApp();
  if (!archive) return null;

  const images = event.mediaIds
    .map((id) => archive.byId.get(id))
    .filter((m) => m?.hasImage) as NonNullable<ReturnType<typeof archive.byId.get>>[];
  const videos = event.mediaIds
    .map((id) => archive.byId.get(id))
    .filter((m) => m?.hasVideo);

  const config = archive.repository;

  if (images.length === 0) {
    const video = videos[0];
    return (
      <div className={cn("flex aspect-[4/3] items-center justify-center bg-card-2 p-4 text-center", rounded, className)}>
        <span className="font-display text-[15px] leading-snug text-ink-3">
          {video?.category ?? event.title}
        </span>
      </div>
    );
  }

  if (images.length === 1) {
    const m = images[0];
    return (
      <div className={cn("media-tile", rounded, className)}>
        <img src={thumbUrl(config, m.imagePath)} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }

  const [main, ...rest] = images.slice(0, 4);
  return (
    <div className={cn("grid grid-cols-3 grid-rows-2 gap-0.5 overflow-hidden", rounded, className)}>
      <div className="media-tile col-span-2 row-span-2">
        <img src={thumbUrl(config, main.imagePath)} alt={main.title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      {rest.slice(0, 2).map((m) => (
        <div key={m.id} className="media-tile">
<img src={thumbUrl(config, m.imagePath)} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}