import type { GalleryView, MediaItem } from "../../types";
import { formatDate, groupByDay } from "../../utils/date";
import { MediaCard } from "./MediaCard";
import { cn } from "../../utils/cn";

interface Props {
  items: MediaItem[];
  view: GalleryView;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (index: number) => void;
  onAddToCollection?: (media: MediaItem) => void;
}

/** Natural-aspect masonry tile (uses 3:4 portrait placeholder until the image loads). */
function MasonryTile({ media, ...rest }: { media: MediaItem; index: number; selected: boolean; selectionMode: boolean; onToggleSelect: (id: string) => void; onOpen: (index: number) => void; onAddToCollection?: (media: MediaItem) => void }) {
  return (
    <div className="mb-3 break-inside-avoid">
      <MediaCard media={media} {...rest} />
    </div>
  );
}

export function MediaGrid({
  items,
  view,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpen,
  onAddToCollection,
}: Props) {
  if (view === "timeline") {
    const days = groupByDay(items.map((m) => ({ id: m.id, date: m.date })));
    return (
      <div className="space-y-10">
        {days.map((day) => (
          <section key={day.key} aria-label={formatDate(day.date)}>
            <h3 className="mb-3 flex items-baseline gap-3">
              <span className="text-[15px] font-semibold text-ink">{formatDate(day.date)}</span>
              <span className="text-[12px] tabular-nums text-ink-3">
                {day.ids.length} {day.ids.length === 1 ? "memory" : "memories"}
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {day.ids.map((id) => {
                const index = items.findIndex((m) => m.id === id);
                const m = items[index];
                if (!m) return null;
                return (
                  <MediaCard
                    key={m.id}
                    media={m}
                    index={index}
                    selected={selectedIds.has(m.id)}
                    selectionMode={selectionMode}
                    onToggleSelect={onToggleSelect}
                    onOpen={onOpen}
                    onAddToCollection={onAddToCollection}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (view === "masonry") {
    return (
      <div className="columns-2 gap-3 sm:columns-3 xl:columns-4">
        {items.map((m, index) => (
          <MasonryTile
            key={m.id}
            media={m}
            index={index}
            selected={selectedIds.has(m.id)}
            selectionMode={selectionMode}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            onAddToCollection={onAddToCollection}
          />
        ))}
      </div>
    );
  }

  const comfortable = view === "comfortable";
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        comfortable
          ? "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      )}
    >
      {items.map((m, index) => (
        <MediaCard
          key={m.id}
          media={m}
          index={index}
          selected={selectedIds.has(m.id)}
          selectionMode={selectionMode}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
          onAddToCollection={onAddToCollection}
        />
      ))}
    </div>
  );
}