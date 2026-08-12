import { Link } from "react-router-dom";
import type { MemoryEvent } from "../../types";
import { formatDate, plural } from "../../utils/date";
import { EventCover } from "./EventCover";

export function EventCard({ event }: { event: MemoryEvent }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-line-strong hover:shadow-card"
    >
      <EventCover event={event} rounded="rounded-none" className="aspect-[4/3]" />
      <div className="p-3.5">
        <h3 className="clamp-1 text-[14.5px] font-semibold text-ink group-hover:text-accent">
          {event.title}
        </h3>
        <p className="mt-0.5 text-[12px] text-ink-3">
          {formatDate(event.date)} · {plural(event.mediaIds.length, "memory")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {event.people.slice(0, 3).map((p) => (
            <span key={p} className="rounded-full bg-card-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
              {p}
            </span>
          ))}
          {event.people.length === 0 && event.subcategories[0] && (
            <span className="truncate rounded-full bg-card-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
              {event.subcategories[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}