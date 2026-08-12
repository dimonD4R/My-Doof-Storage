import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MediaItem, MemoryEvent } from "../types";
import { useApp } from "../state/AppStore";
import { mediaUrls, thumbUrl } from "../data/mediaUrlResolver";
import { formatDayMonth, formatMonthYear, monthName, plural } from "../utils/date";
import { SearchBar } from "../components/search/SearchBar";
import {
  IconArrowRight,
  IconCalendar,
  IconFolder,
  IconHeart,
  IconPlay,
  IconShuffle,
  IconSparkles,
  IconTags,
  IconUsers,
} from "../components/ui/icons";

export function HomePage() {
  const { archive, openLightbox, recentIds, collections, favoriteCount } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!archive) return null;
    const photos = archive.media.filter((m) => m.hasImage).length;
    const videos = archive.media.filter((m) => m.hasVideo).length;
    return {
      memories: archive.media.length,
      photos,
      videos,
      events: archive.events.length,
      categories: archive.categories.length,
      years: archive.years.length,
      people: archive.people.length,
    };
  }, [archive]);

  const recentMedia = useMemo<MediaItem[]>(() => {
    if (!archive) return [];
    return recentIds
      .map((id) => archive.byId.get(id))
      .filter((m): m is MediaItem => !!m);
  }, [archive, recentIds]);

  const memoryOfDay = useMemo(() => {
    if (!archive) return null;
    const now = new Date();
    const todays = archive.media.filter(
      (m) => m.date && m.date.getMonth() === now.getMonth() && m.date.getDate() === now.getDate()
    );
    if (todays.length === 0) return null;
    const first = todays[0];
    const group = archive.events.find((e) => e.date && e.mediaIds.includes(first.id));
    return { count: todays.length, year: first.date!.getFullYear(), group: group ?? null };
  }, [archive]);

  const timeline = useMemo(() => {
    if (!archive) return [];
    const byYear = new Map<number, MemoryEvent[]>();
    for (const ev of archive.events) {
      if (!ev.date) continue;
      const y = ev.date.getFullYear();
      const arr = byYear.get(y) ?? [];
      arr.push(ev);
      byYear.set(y, arr);
    }
    return Array.from(byYear.entries())
      .sort(([a], [b]) => b - a)
      .slice(0, 3)
      .map(([year, events]) => {
        const byMonth = new Map<number, MemoryEvent[]>();
        for (const ev of events) {
          if (!ev.date) continue;
          const arr = byMonth.get(ev.date.getMonth()) ?? [];
          arr.push(ev);
          byMonth.set(ev.date.getMonth(), arr);
        }
        const months = Array.from(byMonth.entries())
          .sort(([a], [b]) => a - b)
          .map(([m, evs]) => ({
            month: m,
            events: [...evs].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)),
          }));
        return { year, months };
      });
  }, [archive]);

  if (!archive) return null;

  return (
    <div className="anim-rise">
      <section className="mb-10 pt-4 sm:pt-8">
        <p className="mb-2 text-[13px] text-ink-3">{greeting()}</p>
        <h1 className="font-display text-[34px] leading-[1.08] text-ink sm:text-[44px]">Your Memories</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Every moment, organized beautifully.{" "}
          <span className="text-ink">{plural(stats!.memories, "moment")} preserved.</span>
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBar size="lg" onNavigate={() => navigate("/memories?")} />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <Stat label="Memories" value={stats!.memories} />
          <Stat label="Photos" value={stats!.photos} />
          <Stat label="Videos" value={stats!.videos} />
          <Stat label="Events" value={stats!.events} />
          <Stat label="Categories" value={stats!.categories} />
          <Stat label="Years" value={stats!.years} />
        </div>
      </section>

      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconShuffle width={20} height={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink">Surprise me</p>
            <p className="text-[12.5px] text-ink-2">Revisit a random moment from your archive.</p>
          </div>
          <button
            onClick={() => {
              const i = Math.floor(Math.random() * archive.media.length);
              openLightbox(archive.media, i);
            }}
            className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-[13px] font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            Open a memory
          </button>
        </div>
      </section>

      {memoryOfDay && (
        <section className="mb-10">
          <SectionHeader eyebrow="On this day" title="A memory worth revisiting" />
          <button
            onClick={() => memoryOfDay.group && navigate(`/events/${memoryOfDay.group.id}`)}
            className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-card p-5 text-left transition-colors hover:border-line-strong"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <IconSparkles width={20} height={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">
                You captured {plural(memoryOfDay.count, "memory")} on{" "}
                {formatDayMonth(memoryOfDay.group?.date ?? new Date(memoryOfDay.year, 0, 1))}{" "}
                <span className="font-normal text-ink-2">in {memoryOfDay.year}.</span>
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">{memoryOfDay.group?.category}</p>
            </div>
            <IconArrowRight width={18} height={18} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-1" />
          </button>
        </section>
      )}

      {recentMedia.length > 0 && (
        <section className="mb-10">
          <SectionHeader
            eyebrow="Continue where you left off"
            title="Recently viewed"
            action={
              <Link to="/memories" className="text-[12.5px] font-medium text-accent">View all memories →</Link>
            }
          />
          <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
            {recentMedia.slice(0, 10).map((m, i) => (
              <RecentTile
                key={m.id}
                media={m}
                index={i}
                onClick={() => openLightbox(recentMedia.slice(0, 10), i)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <SectionHeader
          eyebrow="A walk through time"
          title="By year"
          action={
            <Link to="/timeline" className="text-[12.5px] font-medium text-accent">Full timeline →</Link>
          }
        />
        <div className="space-y-6">
          {timeline.map(({ year, months }) => (
            <div key={year}>
              <h3 className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-ink">
                {year}
                <span className="h-px flex-1 bg-line" />
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {months.map(({ month, events }) => (
                  <Link
                    key={month}
                    to={`/timeline?year=${year}`}
                    className="rounded-xl border border-line bg-card px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-card-2"
                  >
                    <p className="text-[13px] font-semibold text-ink">{monthName(month)}</p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-3">
                      {events.map((e) => e.category).join(" · ")}
                    </p>
                    <p className="mt-1 text-[11px] tabular-nums text-ink-3">
                      {plural(events.reduce((n, e) => n + e.mediaIds.length, 0), "memory")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-5 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="Latest"
            title="Events"
            action={
              <Link to="/events" className="text-[12.5px] font-medium text-accent">All events →</Link>
            }
          />
          <ul className="space-y-2">
            {archive.events.slice(0, 5).map((ev) => (
              <li key={ev.id}>
                <Link
                  to={`/events/${ev.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-card-2"
                >
                  <span className="text-ink-3"><IconCalendar width={17} height={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{ev.title}</span>
                    <span className="block text-[11.5px] text-ink-3">
                      {formatMonthYear(ev.date)} · {plural(ev.mediaIds.length, "memory")}
                    </span>
                  </span>
                  <span className="text-ink-3 transition-transform group-hover:translate-x-0.5">
                    <IconArrowRight width={16} height={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div>
            <SectionHeader
              eyebrow="Curated"
              title="Collections"
              action={
                <Link to="/collections" className="text-[12.5px] font-medium text-accent">All collections →</Link>
              }
            />
            {collections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-[12.5px] text-ink-3">
                No collections yet — group memories across events and years.
              </p>
            ) : (
              <ul className="space-y-2">
                {collections.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/collections/${c.id}`}
                      className="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-card-2"
                    >
                      <span className="text-ink-3"><IconFolder width={17} height={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{c.name}</span>
                        <span className="block text-[11.5px] text-ink-3">{plural(c.mediaIds.length, "memory")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <QuickChip to="/favorites" icon={<IconHeart width={15} height={15} />} label="Favorites" count={favoriteCount} />
            <QuickChip to="/categories" icon={<IconTags width={15} height={15} />} label="Categories" count={archive.categories.length} />
            <QuickChip to="/people" icon={<IconUsers width={15} height={15} />} label="People" count={archive.people.length} />
          </div>
        </div>
      </section>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-3 text-center">
      <p className="font-display text-[22px] tabular-nums leading-none text-ink">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-3">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">{eyebrow}</p>
        <h2 className="mt-0.5 font-display text-[22px] leading-tight text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function RecentTile({ media, index, onClick }: { media: MediaItem; index: number; onClick: () => void }) {
  const { archive } = useApp();
  if (!archive) return null;
  const url = mediaUrls(archive.repository, media);
  return (
    <button onClick={onClick} className="group w-36 shrink-0 text-left">
      <div className="media-tile relative aspect-square w-full rounded-xl border border-line">
        {media.hasImage ? (
          <img src={thumbUrl(archive.repository, media.imagePath)} alt={media.title} loading="lazy" className="h-full w-full object-cover" />
        ) : media.hasVideo ? (
          <video src={url.video} preload="metadata" muted playsInline className="h-full w-full object-cover" />
        ) : null}
        {media.hasVideo && (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/55 px-1 py-0.5 text-[9px] font-medium text-white">
            <IconPlay width={9} height={9} /> video
          </span>
        )}
      </div>
      <p className="mt-1.5 truncate text-[11.5px] font-medium text-ink">{media.category}</p>
      <p className="truncate text-[11px] text-ink-3">{formatDayMonth(media.date)}</p>
      <span className="sr-only">Position {index + 1}</span>
    </button>
  );
}

function QuickChip({ to, icon, label, count }: { to: string; icon: React.ReactNode; label: string; count: number }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
    >
      <span className="text-ink-3">{icon}</span>
      {label}
      <span className="tabular-nums text-ink-3">{count}</span>
    </Link>
  );
}