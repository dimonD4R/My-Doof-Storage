import type { Filters } from "../../types";
import { IconX } from "../ui/icons";
import { monthName } from "../../utils/date";

function labelFor(group: string, value: string | number): string {
  switch (group) {
    case "years": return `Year: ${value}`;
    case "months": return monthName(Number(value));
    case "categories": return String(value);
    case "subcategories": return String(value);
    case "keywords": return String(value);
    case "people": return String(value);
    case "mediaTypes":
      return value === "photo" ? "Photos" : value === "video" ? "Videos" : "Photo + video";
    default: return String(value);
  }
}

const GROUPS: { key: keyof Filters; array?: boolean; label: (f: Filters) => string[] }[] = [
  { key: "years", array: true, label: () => [] },
  { key: "months", array: true, label: () => [] },
  { key: "categories", array: true, label: () => [] },
  { key: "subcategories", array: true, label: () => [] },
  { key: "keywords", array: true, label: () => [] },
  { key: "people", array: true, label: () => [] },
  { key: "mediaTypes", array: true, label: () => [] },
];

export function ActiveFilters({
  filters,
  onPatch,
  onReset,
}: {
  filters: Filters;
  onPatch: (p: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const chips: { group: "years" | "months" | "categories" | "subcategories" | "keywords" | "people" | "mediaTypes"; value: string | number }[] = [];

  for (const g of GROUPS) {
    const val = filters[g.key];
    if (Array.isArray(val)) {
      for (const v of val) chips.push({ group: g.key as never, value: v });
    }
  }
  if (filters.miniVideoFilter === "withVideo") chips.push({ group: "mediaTypes", value: "withVideo" });
  if (filters.miniVideoFilter === "withoutVideo") chips.push({ group: "mediaTypes", value: "withoutVideo" });
  if (filters.favoritesOnly) chips.push({ group: "categories", value: "Favorites" });
  if (filters.search.trim()) chips.push({ group: "keywords", value: `“${filters.search.trim()}”` });
  if (filters.dateFrom || filters.dateTo) {
    chips.push({ group: "categories", value: `Dates ${filters.dateFrom ?? "…"} → ${filters.dateTo ?? "…"}` });
  }

  if (chips.length === 0) return null;

  const remove = (g: string, value: string | number) => {
    const patch: Partial<Filters> = {};
    if (g === "years") patch.years = filters.years.filter((y) => y !== value);
    else if (g === "months") patch.months = filters.months.filter((m) => m !== value);
    else if (g === "categories") patch.categories = filters.categories.filter((c) => c !== value);
    else if (g === "subcategories") patch.subcategories = filters.subcategories.filter((s) => s !== value);
    else if (g === "keywords") {
      if (String(value).startsWith("“")) {
        patch.search = "";
      } else {
        patch.keywords = filters.keywords.filter((k) => k !== value);
      }
    } else if (g === "people") patch.people = filters.people.filter((p) => p !== value);
    else if (g === "mediaTypes") {
      if (value === "withVideo") patch.miniVideoFilter = "all";
      else if (value === "withoutVideo") patch.miniVideoFilter = "all";
      else patch.mediaTypes = filters.mediaTypes.filter((t) => t !== value);
    }
    onPatch(patch);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <button
          key={`${c.group}-${c.value}-${i}`}
          onClick={() => remove(c.group, c.value)}
          className="group inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[12.5px] font-medium text-ink shadow-card ring-1 ring-line transition-colors hover:text-accent"
          aria-label={`Remove filter ${labelFor(c.group, c.value)}`}
        >
          {labelFor(c.group, c.value)}
          <IconX width={12} height={12} className="text-ink-3 group-hover:text-accent" />
        </button>
      ))}
      <button
        onClick={onReset}
        className="ml-1 text-[12.5px] font-medium text-accent hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}