import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { MediaItem } from "../types";
import { useApp } from "../state/AppStore";
import { plural } from "../utils/date";
import { sortMedia } from "../lib/filtering";
import { EventCover } from "../components/events/EventCover";
import { MediaGrid } from "../components/gallery/MediaGrid";
import { StoryViewer } from "../components/media/StoryViewer";
import { ShareModal } from "../components/sharing/ShareModal";
import { DownloadDialog } from "../components/downloads/DownloadDialog";
import { Button, Chip, EmptyState } from "../components/ui";
import { IconArrowLeft, IconCalendar, IconDownload, IconPlay, IconShare } from "../components/ui/icons";

export function EventDetailPage() {
  const { id } = useParams();
  const { archive, openLightbox } = useApp();
  const [storyOpen, setStoryOpen] = useState(false);
  const [presentOpen, setPresentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);

  const event = useMemo(() => archive?.events.find((e) => e.id === id), [archive, id]);
  const media = useMemo<MediaItem[]>(() => {
    if (!archive || !event) return [];
    const items = event.mediaIds.map((mid) => archive.byId.get(mid)).filter((m): m is MediaItem => !!m);
    return sortMedia(items, "oldest");
  }, [archive, event]);

  if (!archive) return null;
  if (!event) {
    return (
      <EmptyState
        title="Event not found"
        message="This event may have changed or been removed."
        action={<Link to="/events" className="text-[13px] font-medium text-accent">← Back to events</Link>}
      />
    );
  }

  const handleOpen = (index: number) => openLightbox(media, index);

  return (
    <div className="anim-rise">
      <Link to="/events" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink">
        <IconArrowLeft width={15} height={15} /> All events
      </Link>

      <div className="mb-8 grid gap-6 md:grid-cols-[340px_1fr]">
        <EventCover event={event} className="aspect-[4/3] md:aspect-auto md:min-h-[280px]" />

        <div className="flex flex-col justify-center">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
            <IconCalendar width={14} height={14} />
            {event.date ? event.date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "Unknown date"}
          </p>
          <h1 className="mt-2 font-display text-[30px] leading-tight text-ink sm:text-[38px]">{event.title}</h1>
          <p className="mt-2 text-[14px] text-ink-2">
            {plural(event.photoCount, "photo")} · {plural(event.videoCount, "video")} ·{" "}
            {plural(event.mediaIds.length, "memory")}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {event.people.map((p) => (
              <Chip key={p}>{p}</Chip>
            ))}
            {event.keywords.slice(0, 6).map((k) => (
              <Chip key={k} className="text-ink-3">{k}</Chip>
            ))}
          </div>

          {event.subcategories.length > 0 && (
            <p className="mt-3 text-[12.5px] text-ink-3">Subcategories: {event.subcategories.join(" · ")}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" size="md" onClick={() => setShareOpen(true)}>
              <IconShare width={15} height={15} /> Share event
            </Button>
            <Button variant="secondary" size="md" onClick={() => setStoryOpen(true)}>
              <IconPlay width={15} height={15} /> Story mode
            </Button>
            <Button variant="secondary" size="md" onClick={() => setPresentOpen(true)}>
              Present
            </Button>
            <Button variant="secondary" size="md" onClick={() => setDlOpen(true)}>
              <IconDownload width={15} height={15} /> Download
            </Button>
          </div>
        </div>
      </div>

      <MediaGrid
        items={media}
        view="grid"
        selectionMode={false}
        selectedIds={new Set()}
        onToggleSelect={() => undefined}
        onOpen={handleOpen}
      />

      {storyOpen && (
        <StoryViewer items={media} title={event.title} onClose={() => setStoryOpen(false)} onOpenLightbox={(i) => {
          setStoryOpen(false);
          openLightbox(media, i);
        }} />
      )}
      {presentOpen && (
        <StoryViewer items={media} title={event.title} onClose={() => setPresentOpen(false)} />
      )}
      {shareOpen && (
        <ShareModal
          kind="event"
          targetId={event.id}
          name={event.title}
          about={`${event.category} · ${formatEventDate(event)}`}
          media={media}
          onClose={() => setShareOpen(false)}
        />
      )}
      {dlOpen && (
        <DownloadDialog
          targets={media.map((m, i) => ({ media: m, which: m.hasImage ? "image" : "video", sortIndex: i }))}
          zipName={event.title}
          groupDir={event.title}
          onClose={() => setDlOpen(false)}
        />
      )}
    </div>
  );
}

function formatEventDate(event: { date: Date | null }): string {
  if (!event.date) return "Undated event";
  return event.date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}