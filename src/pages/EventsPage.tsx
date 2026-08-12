import { Link } from "react-router-dom";
import { useApp } from "../state/AppStore";
import { plural } from "../utils/date";
import { EventCard } from "../components/events/EventCard";
import { EmptyState } from "../components/ui";
import { IconCalendar } from "../components/ui/icons";

export function EventsPage() {
  const { archive } = useApp();
  if (!archive) return null;

  const grouped = Array.from(
    archive.events.reduce((map, ev) => {
      const year = ev.date?.getFullYear();
      const key = year != null ? `${year}` : "Undated";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
      return map;
    }, new Map<string, typeof archive.events>())
  ).map(([year, events]) => ({ year, events }));

  return (
    <div className="anim-rise">
      <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Events</h1>
      <p className="mb-6 text-[13px] text-ink-2">
        {plural(archive.events.length, "event")} grouped by theme and date. Events are derived automatically from your archive.
      </p>

      {archive.events.length === 0 ? (
        <EmptyState
          icon={<IconCalendar width={30} height={30} />}
          title="No events yet"
          message="Events appear here as memories with categories and dates are added."
        />
      ) : (
        <div className="space-y-10">
          {grouped.map(({ year, events }) => (
            <section key={year} aria-label={year}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[16px] font-semibold text-ink">{year === "Undated" ? "Undated" : year}</h2>
                <span className="text-[12px] text-ink-3">
                  {plural(events.reduce((n, e) => n + e.mediaIds.length, 0), "memory")}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Link to="/timeline" className="mt-8 inline-block text-[13px] font-medium text-accent">
        View as timeline →
      </Link>
    </div>
  );
}
