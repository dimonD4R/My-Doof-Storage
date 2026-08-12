import type { Collection, Filters, MediaItem, MediaType, SortKey } from "../types";

export interface FilterOptions {
  favorites: ReadonlySet<string>;
  collections: Collection[];
}

/** Composable filter engine. Pure and side-effect free. */
export function applyFilters(
  items: MediaItem[],
  f: Filters,
  opts: FilterOptions
): MediaItem[] {
  // Personal (search) filter first — cheap and gives correct AND semantics.
  let result = items;
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter((m) => matchesQuery(m, q));
  }

  if (f.years.length) result = result.filter((m) => m.date && f.years.includes(m.date.getFullYear()));
  if (f.months.length) result = result.filter((m) => m.date && f.months.includes(m.date.getMonth()));
  if (f.categories.length) result = result.filter((m) => f.categories.includes(m.category));
  if (f.subcategories.length) result = result.filter((m) => m.subcategories.some((s) => f.subcategories.includes(s)));
  if (f.keywords.length) result = result.filter((m) => m.keywords.some((k) => f.keywords.includes(k)));
  if (f.people.length) result = result.filter((m) => m.people.some((p) => f.people.includes(p)));
  if (f.mediaTypes.length) result = result.filter((m) => f.mediaTypes.includes(m.mediaType));

  if (f.miniVideoFilter === "withVideo") result = result.filter((m) => m.hasVideo);
  if (f.miniVideoFilter === "withoutVideo") result = result.filter((m) => !m.hasVideo);

  if (f.favoritesOnly) {
    const fav = opts.favorites;
    result = result.filter((m) => fav.has(m.id));
  }

  if (f.collectionId) {
    const collection = opts.collections.find((c) => c.id === f.collectionId);
    if (collection && collection.mediaIds.length) {
      const set = new Set(collection.mediaIds);
      result = result.filter((m) => set.has(m.id));
    } else {
      result = [];
    }
  }

  if (f.dateFrom) {
    result = result.filter((m) => m.dateISO >= f.dateFrom!);
  }
  if (f.dateTo) {
    result = result.filter((m) => m.dateISO <= f.dateTo!);
  }

  return result;
}

const searchBlobCache = new WeakMap<MediaItem, string>();

export function searchBlob(m: MediaItem): string {
  let blob = searchBlobCache.get(m);
  if (blob) return blob;
  const parts = [
    m.title,
    m.category,
    m.id,
    ...m.subcategories,
    ...m.keywords,
    ...m.people,
    m.fileName,
    m.dateISO,
    m.date ? String(m.date.getFullYear()) : "",
  ];
  blob = parts.filter(Boolean).join(" \u0000 ").toLowerCase();
  searchBlobCache.set(m, blob);
  return blob;
}

export function matchesQuery(m: MediaItem, queryLower: string): boolean {
  const blob = searchBlob(m);
  const tokens = queryLower.trim().split(/\s+/).filter(Boolean);
  return tokens.every((t) => blob.includes(t));
}

export function sortMedia(items: MediaItem[], key: SortKey): MediaItem[] {
  const arr = [...items];
  switch (key) {
    case "newest":
      return arr.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
    case "oldest":
      return arr.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
    case "recentlyAdded":
      return arr.sort((a, b) => b.sourceIndex - a.sourceIndex);
    case "nameAsc":
      return arr.sort((a, b) => a.fileName.localeCompare(b.fileName));
    case "nameDesc":
      return arr.sort((a, b) => b.fileName.localeCompare(a.fileName));
    case "category":
      return arr.sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
      );
  }
  return arr;
}

/** Human-readable label for a media type filter. */
export function mediaTypeLabel(t: MediaType): string {
  if (t === "photo") return "Photos";
  if (t === "video") return "Videos";
  return "Photo + video";
}

export function queryHasContent(f: Filters): boolean {
  return (
    f.search.trim() !== "" ||
    f.years.length > 0 ||
    f.months.length > 0 ||
    f.categories.length > 0 ||
    f.subcategories.length > 0 ||
    f.keywords.length > 0 ||
    f.people.length > 0 ||
    f.mediaTypes.length > 0 ||
    f.miniVideoFilter !== "all" ||
    f.favoritesOnly ||
    !!f.collectionId ||
    !!f.dateFrom ||
    !!f.dateTo
  );
}