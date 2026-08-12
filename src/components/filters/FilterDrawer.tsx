import { useMemo, useState } from "react";
import type { Archive, Filters } from "../../types";
import { Chip } from "../ui";
import { Overlay } from "../ui/Overlay";
import { monthName } from "../../utils/date";
import { cn } from "../../utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  archive: Archive | null;
  filters: Filters;
  onPatch: (p: Partial<Filters>) => void;
  onReset: () => void;
  resultCount: number;
  totalCount: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{title}</h3>
      {children}
    </section>
  );
}

export function FilterDrawer({ open, onClose, archive, filters, onPatch, onReset, resultCount, totalCount }: Props) {
  const [customRange, setCustomRange] = useState(() => ({
    from: filters.dateFrom ?? "",
    to: filters.dateTo ?? "",
  }));

  const snapshots = useMemo(
    () => ({
      years: archive?.years ?? [],
      months: Array.from({ length: 12 }, (_, i) => i),
      categories: archive?.categories ?? [],
      subcategories: archive?.subcategories ?? [],
      people: archive?.people ?? [],
      keywords: (archive?.keywords ?? []).slice(0, 60),
    }),
    [archive]
  );

  const visibleSubcategories = useMemo(() => {
    if (!archive) return [];
    if (filters.categories.length === 0) return archive.subcategories;
    const names = new Set<string>();
    for (const m of archive.media) {
      if (filters.categories.includes(m.category)) m.subcategories.forEach((s) => names.add(s));
    }
    return archive.subcategories.filter((s) => names.has(s.name));
  }, [archive, filters.categories]);

  const toggle = <T,>(field: keyof Filters, value: T) => {
    const current = filters[field] as T[];
    onPatch({
      [field]: current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value],
    } as Partial<Filters>);
  };

  const isValidDate = (d: string) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);

  return (
    <Overlay
      open={open}
      onClose={onClose}
      side="bottom"
      title="Filters"
      ariaLabel="Filter memories"
      panelClassName="sm:mx-auto sm:mb-4 sm:w-[520px] sm:max-w-[calc(100vw-24px)] sm:rounded-2xl sm:border sm:shadow-float"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-ink-2">
            <span className="font-semibold text-ink tabular-nums">{resultCount}</span> of {totalCount} memories
          </span>
          <div className="flex gap-2">
            <button onClick={onReset} className="h-8 rounded-full px-3 text-[12.5px] font-medium text-ink-2 hover:text-ink">
              Clear all
            </button>
            <button onClick={onClose} className="inline-flex h-8 items-center rounded-full bg-accent px-4 text-[12.5px] font-medium text-accent-ink">
              Show results
            </button>
          </div>
        </div>
      }
    >
      <div className="pb-4">
        <Section title="Year">
          <div className="flex flex-wrap gap-1.5">
            {snapshots.years.map((y) => (
              <Chip key={y} selected={filters.years.includes(y)} onClick={() => toggle("years", y)}>
                {y}
              </Chip>
            ))}
            {snapshots.years.length === 0 && <span className="text-[12px] text-ink-3">No dated memories</span>}
          </div>
        </Section>

        <Section title="Month">
          <div className="flex flex-wrap gap-1.5">
            {snapshots.months.map((m) => (
              <Chip key={m} selected={filters.months.includes(m)} onClick={() => toggle("months", m)}>
                {monthName(m).slice(0, 3)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Date range">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customRange.from}
              max={customRange.to || undefined}
              onChange={(e) => {
                setCustomRange((c) => ({ ...c, from: e.target.value }));
                if (isValidDate(e.target.value)) onPatch({ dateFrom: e.target.value || null });
              }}
              className="h-9 flex-1 rounded-xl border border-line bg-canvas px-2.5 text-[12.5px] text-ink focus:border-ink-3 focus:outline-none"
              aria-label="From date"
            />
            <span className="text-ink-3">→</span>
            <input
              type="date"
              value={customRange.to}
              min={customRange.from || undefined}
              onChange={(e) => {
                setCustomRange((c) => ({ ...c, to: e.target.value }));
                if (isValidDate(e.target.value)) onPatch({ dateTo: e.target.value || null });
              }}
              className="h-9 flex-1 rounded-xl border border-line bg-canvas px-2.5 text-[12.5px] text-ink focus:border-ink-3 focus:outline-none"
              aria-label="To date"
            />
          </div>
        </Section>

        <Section title="Category">
          <div className="flex flex-wrap gap-1.5">
            {snapshots.categories.map((c) => (
              <Chip key={c.name} selected={filters.categories.includes(c.name)} onClick={() => toggle("categories", c.name)}>
                {c.name}
                <span className="opacity-50 tabular-nums">{c.count}</span>
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Subcategory">
          <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
            {visibleSubcategories.map((s) => (
              <Chip key={s.name} selected={filters.subcategories.includes(s.name)} onClick={() => toggle("subcategories", s.name)}>
                {s.name}
                <span className="opacity-50 tabular-nums">{s.count}</span>
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="People">
          <div className="flex flex-wrap gap-1.5">
            {snapshots.people.map((p) => (
              <Chip key={p.name} selected={filters.people.includes(p.name)} onClick={() => toggle("people", p.name)}>
                {p.name}
                <span className="opacity-50 tabular-nums">{p.count}</span>
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Media type">
          <div className="flex flex-wrap gap-1.5">
            <Chip selected={filters.mediaTypes.includes("photo")} onClick={() => toggle("mediaTypes", "photo")}>Photos</Chip>
            <Chip selected={filters.mediaTypes.includes("video")} onClick={() => toggle("mediaTypes", "video")}>Videos</Chip>
            <Chip selected={filters.mediaTypes.includes("both")} onClick={() => toggle("mediaTypes", "both")}>Photos + videos</Chip>
            <span className="mx-1 my-auto h-4 w-px bg-line" aria-hidden="true" />
            <Chip selected={filters.miniVideoFilter === "withVideo"} onClick={() => onPatch({ miniVideoFilter: filters.miniVideoFilter === "withVideo" ? "all" : "withVideo" })}>
              With video
            </Chip>
            <Chip selected={filters.miniVideoFilter === "withoutVideo"} onClick={() => onPatch({ miniVideoFilter: filters.miniVideoFilter === "withoutVideo" ? "all" : "withoutVideo" })}>
              Without video
            </Chip>
          </div>
        </Section>

        <Section title="Favorites only">
          <Chip selected={filters.favoritesOnly} onClick={() => onPatch({ favoritesOnly: !filters.favoritesOnly })}>
            {filters.favoritesOnly ? "Showing favorites" : "Show favorites only"}
          </Chip>
        </Section>

        {snapshots.keywords.length > 0 && (
          <Section title="Keywords">
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {snapshots.keywords.map((k) => (
                <Chip
                  key={k.name}
                  selected={filters.keywords.includes(k.name)}
                  onClick={() => toggle("keywords", k.name)}
                  className={cn(filters.keywords.includes(k.name) && "bg-accent text-accent-ink border-accent")}
                >
                  {k.name}
                </Chip>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Overlay>
  );
}