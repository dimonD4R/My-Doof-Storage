import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { MemoryEvent } from "../types";
import { useApp } from "../state/AppStore";
import { formatDayMonth, monthName, plural } from "../utils/date";
import { EventCover } from "../components/events/EventCover";
import { EmptyState } from "../components/ui";
import { IconTimeline } from "../components/ui/icons";
import { cn } from "../utils/cn";

export function TimelinePage() {
  const { archive } = useApp();
  const [params, setParams] = useSearchParams();
  const [hovered, setHovered] = useState<string | null>(null);

  const allYears = archive?.years ?? [];
  const selectedYear = params.get("year");
  const year = selectedYear && allYears.includes(Number(selectedYear)) ? Number(selectedYear) : null;

  const structure = useMemo(() => {
    if (!archive) return [];
    const years = year ? [year] : allYears;
    return years.map((y) => {
      const evs = archive.events.filter((e) => e.date && e.date.getFullYear() === y);
      const byMonth = new Map<number, (typeof archive.events)[number][]>();
      for (const ev of evs) {
        const m = ev.date!.getMonth();
        if (!byMonth.has(m)) byMonth.set(m, []);
        byMonth.get(m)!.push(ev);
      }
      const months = Array.from(byMonth.entries())
        .sort(([a], [b]) => b - a)
        .map(([m, events]) => ({
          month: m,
          days: groupDays(events),
        }));
      return { year: y, total: evs.reduce((n, e) => n + e.mediaIds.length, 0), months };
    });
  }, [archive, allYears, year]);

  if (!archive) return null;

  return (
    <div className="anim-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Timeline</h1>
          <p className="text-[13px] text-ink-2">Every event, in the order it happened.</p>
        </div>
        <select
          value={year ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setParams(v ? { year: v } : {}, { replace: true });
          }}
          aria-label="Filter by year"
          className="h-9 rounded-full border border-line bg-card px-3 pr-8 text-[12.5px] font-medium text-ink-2 focus:outline-none"
        >
          <option value="">All years</option>
          {allYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {structure.length === 0 || structure.every((s) => s.months.length === 0) ? (
        <EmptyState
          icon={<IconTimeline width={30} height={30} />}
          title="Nothing on the timeline yet"
          message="Dated memories appear here automatically."
        />
      ) : (
        <div className="relative space-y-10">
          <span className="absolute left-[9px] top-2 bottom-2 w-px bg-line sm:left-[15px]" aria-hidden="true" />
          {structure.map(({ year: y, total, months }) => (
            <section key={y} className="relative pl-8 sm:pl-14">
              <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent bg-card sm:left-1 sm:h-8 sm:w-8">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <h2 className="font-display text-[30px] leading-none text-ink">{y}</h2>
              <p className="mt-1 text-[12px] text-ink-3">{plural(total, "memory")} captured</p>

              <div className="mt-6 space-y-8">
                {months.map(({ month, days }) => (
                  <div key={month}>
                    <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-3">
                      {monthName(month)}
                    </h3>
                    <div className="space-y-3">
                      {days.map(({ dayKey, date, events }) => (
                        <Link
                          key={dayKey}
                          to={`/events/${events[0].id}`}
                          onMouseEnter={() => setHovered(events[0].id)}
                          onMouseLeave={() => setHovered(null)}
                          className={cn(
                            "group grid grid-cols-[64px_1fr] sm:grid-cols-[110px_240px_1fr] gap-3 sm:gap-5 items-stretch",
                            hovered === events[0].id && "opacity-100"
                          )}
                        >
                          <div className="text-right text-[12px] text-ink-2">
                            <p className="font-semibold">{formatDayMonth(date).split(" ")[0]} <span className="font-normal text-ink-3">{monthName(month).slice(0, 3)}</span></p>
                          </div>
                          <div className="hidden h-24 overflow-hidden rounded-xl sm:block">
                            <EventCover event={events[0]} rounded="rounded-xl" className="aspect-auto h-full w-full" />
                          </div>
                          <div className="flex flex-col justify-center rounded-xl border border-line bg-card px-4 py-3 transition-colors group-hover:border-line-strong group-hover:bg-card-2">
                            <p className="text-[14px] font-semibold text-ink group-hover:text-accent">
                              {events[0].category}
                              {events.length > 1 && <span className="ml-1.5 text-[11px] font-medium text-ink-3">+{events.length - 1}</span>}
                            </p>
                            <p className="mt-0.5 text-[12px] text-ink-3">
                              {plural(events.reduce((n, e) => n + e.mediaIds.length, 0), "memory")}
                              {events[0].people[0] && ` · ${events[0].people.slice(0, 2).join(", ")}`}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupDays(events: MemoryEvent[]) {
  const byDay = new Map<string, typeof events>();
  for (const ev of events) {
    if (!ev.date) continue;
    const key = `${ev.date.getFullYear()}-${ev.date.getMonth()}-${ev.date.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(ev);
  }
  return Array.from(byDay.entries())
    .map(([key, evs]) => ({ dayKey: key, date: evs[0].date!, events: evs }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}