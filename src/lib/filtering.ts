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
    const folderIndex = collectFolderIndex(items);
    const keywordSet = collectKeywordSet(items);
    result = result.filter((m) => matchesQuery(m, q, folderIndex, keywordSet));
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

/** Leaf folder (last directory) of a media path, e.g. "Mummy - Rahul". */
function leafFolder(path: string): string {
  const parts = path.split("/");
  return parts.length > 1 ? parts[parts.length - 2] : "";
}

/** Index of every leaf folder name in the archive, for folder-scoped search. */
function collectFolderIndex(items: MediaItem[]): string {
  const names = new Set<string>();
  for (const m of items) {
    for (const p of [m.imagePath, m.videoPath]) {
      const f = leafFolder(p);
      if (f) names.add(f.toLowerCase());
    }
  }
  return Array.from(names).join(" \u0000 ");
}

/** Set of every exact keyword in the archive, for exact keyword matching. */
function collectKeywordSet(items: MediaItem[]): Set<string> {
  const names = new Set<string>();
  for (const m of items) {
    for (const k of m.keywords) {
      if (k) names.add(k.toLowerCase());
    }
  }
  return names;
}

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
    leafFolder(m.imagePath),
    leafFolder(m.videoPath),
    m.dateISO,
    m.date ? String(m.date.getFullYear()) : "",
  ];
  blob = parts.filter(Boolean).join(" \u0000 ").toLowerCase();
  searchBlobCache.set(m, blob);
  return blob;
}

/**
 * Search matcher. Priority per query token:
 *  1. Exact keyword match – the token equals one of the item's keywords
 *     (case-insensitive). Searching "rahul" only matches items whose keyword
 *     is exactly "Rahul", never longer phrases like "Lalita Mummy Rahul".
 *  2. Folder-scoped match – the token matches a folder name; the item is kept
 *     only when its own folder contains that word.
 *  3. Full-text fallback – substring match across all searchable fields.
 * Multiple words must all match (AND).
 *
 * Examples:
 *   "rahul"            -> only items with the exact keyword "Rahul"
 *   "rahul lalita"     -> items that have both exact keywords "Rahul" and "Lalita"
 *   "rahul mummy lalita" -> items that have all three exact keywords
 */
export function matchesQuery(
  m: MediaItem,
  queryLower: string,
  folderIndex: string,
  keywordSet: Set<string>
): boolean {
  const q = queryLower.trim().toLowerCase();
  if (!q) return true;
  const kw = new Set(m.keywords.map((k) => k.toLowerCase()));
  // Whole query is itself an exact keyword (e.g. "animal video", "lalita video").
  if (keywordSet.has(q)) return kw.has(q);
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const leaf = [leafFolder(m.imagePath), leafFolder(m.videoPath)]
    .filter(Boolean)
    .join(" \u0000 ")
    .toLowerCase();
  const blob = searchBlob(m);
  return tokens.every((t) => {
    if (keywordSet.has(t)) return kw.has(t);
    if (folderIndex.includes(t)) return leaf.includes(t);
    return blob.includes(t);
  });
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