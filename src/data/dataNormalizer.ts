import type {
  Archive,
  Counted,
  MediaItem,
  MemoryEvent,
  RawDataset,
  RawMedia,
  RepositoryConfig,
} from "../types";
import { parseDateFromTitle, toISODate } from "../utils/date";
import { baseName } from "./mediaUrlResolver";

export interface PeopleConfig {
  /** Words that could look like people but must never be treated as such. */
  neverPeople?: string[];
  /** Extra names that always count as people. */
  alwaysPeople?: string[];
}

const DEFAULT_NEVER_PEOPLE = new Set([
  "Surrounding", "Surroundings", "Views", "View", "Animals", "Animal",
  "Nature", "Biodiversity", "Aravali", "Chidiyaghar", "Video", "Videos",
  "Photo", "Photos", "Only", "And", "The", "Of", "Trip", "Visit",
  "Family", "Friends", "Birthday", "College", "Festival",
]);

function normalizeString(v: unknown, key: string): string {
  const raw = (v as Record<string, unknown>)?.[key];
  if (typeof raw === "string") return raw;
  return "";
}

function normalizeArray(v: unknown, key: string): string[] {
  const raw = (v as Record<string, unknown>)?.[key];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  if (typeof raw === "string" && raw.trim()) return [raw];
  return [];
}

export function normalizeOne(
  raw: RawMedia,
  index: number,
  peopleConfig: PeopleConfig
): MediaItem {
  const imagePath = normalizeString(raw, "Image") || normalizeString(raw, "image");
  const videoPath = normalizeString(raw, "video");
  const title = normalizeString(raw, "title") || raw.id || "";
  const id = (raw.id || String(index + 1)).trim();
  const date = parseDateFromTitle(title);

  const subcategories = normalizeArray(raw, "subcategories");
  const keywords = normalizeArray(raw, "keywords");
  const people = detectPeople(keywords, subcategories, peopleConfig);

  return {
    id,
    title,
    dateISO: date ? toISODate(date) : "",
    date,
    imagePath,
    videoPath,
    hasImage: imagePath.length > 0,
    hasVideo: videoPath.length > 0,
    mediaType: imagePath && videoPath ? "both" : videoPath ? "video" : "photo",
    category: normalizeString(raw, "category") || "Uncategorized",
    subcategories,
    keywords,
    people,
    fileName: videoPath ? baseName(videoPath) : imagePath ? baseName(imagePath) : id,
    sourceIndex: index,
  };
}

export function detectPeople(
  keywords: string[],
  subcategories: string[],
  peopleConfig: PeopleConfig = {}
): string[] {
  const never = new Set(DEFAULT_NEVER_PEOPLE);
  for (const w of peopleConfig.neverPeople ?? []) never.add(w);
  const always = new Set(peopleConfig.alwaysPeople ?? []);

  const subWordSet = new Set<string>();
  for (const sc of subcategories) {
    for (const w of sc.split(/[\s\-]+/)) if (w) subWordSet.add(w);
  }

  const found = new Set<string>();
  for (const kw of keywords) {
    const word = kw.trim();
    if (!word) continue;
    if (always.has(word)) found.add(word);
    else if (subWordSet.has(word) && !never.has(word)) found.add(word);
  }
  return Array.from(found);
}

export function normalizeDataset(
  raw: RawDataset,
  repository: RepositoryConfig,
  peopleConfig?: PeopleConfig
): Archive {
  const rawMedia = Array.isArray(raw.videos) ? raw.videos : [];
  const media = rawMedia.map((m, i) => normalizeOne(m, i, peopleConfig ?? {}));

  const byId = new Map<string, MediaItem>();
  for (const m of media) byId.set(m.id, m);

  const categoryCounts = countBy(media, (m) => m.category);
  const subcategoryCounts = countByMany(media, (m) => m.subcategories);
  const keywordCounts = countByMany(media, (m) => m.keywords);
  const peopleCounts = countByMany(media, (m) => m.people);

  const yearSet = new Set<number>();
  for (const m of media) if (m.date) yearSet.add(m.date.getFullYear());
  const years = Array.from(yearSet).sort((a, b) => b - a);

  const events = buildEvents(media, byId);
  const mediaByEventId = new Map<string, MediaItem[]>();
  for (const ev of events) {
    mediaByEventId.set(ev.id, ev.mediaIds.map((id) => byId.get(id)!).filter(Boolean));
  }

  return {
    version: raw.version || "unknown",
    repository,
    media,
    categories: sortCounted(categoryCounts),
    subcategories: sortCounted(subcategoryCounts),
    keywords: sortCounted(keywordCounts),
    years,
    people: sortCounted(peopleCounts),
    events,
    mediaByEventId,
    byId,
  };
}

function buildEvents(
  media: MediaItem[],
  byId: Map<string, MediaItem>
): MemoryEvent[] {
  const groups = new Map<string, MediaItem[]>();

  for (const m of media) {
    let key: string;
    if (m.date) {
      key = `${m.category}::${m.dateISO}`;
    } else {
      key = `${m.category}::undated`;
    }
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push(m);
  }

  const events: MemoryEvent[] = [];
  for (const [key, items] of groups) {
    const [category, dateKey] = key.split("::");
    const dated = items.filter((m) => !!m.date);
    let date: Date | null = null;
    let precision: "day" | "month" | "year" = "day";

    if (dated.length > 0) {
      const sorted = [...dated].sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
      date = sorted[0].date!;
      const first = sorted[0].date!;
      const allSameIsoDay = sorted.every((m) => toISODate(m.date!) === toISODate(first));
      const allSameMonth =
        sorted.every((m) => m.date!.getMonth() === first.getMonth() && m.date!.getFullYear() === first.getFullYear());
      const allSameYear = sorted.every((m) => m.date!.getFullYear() === first.getFullYear());
      precision = allSameIsoDay ? "day" : allSameMonth ? "month" : allSameYear ? "year" : "day";
    } else {
      precision = "year";
    }

    const photoCount = items.filter((m) => m.hasImage).length;
    const videoCount = items.filter((m) => m.hasVideo).length;

    const coverCandidate =
      items.find((m) => m.hasImage) ??
      items.find((m) => m.hasVideo) ??
      items[0];

    const id = slug(`${category}-${dateKey}`);

    events.push({
      id,
      title: category,
      category,
      subcategories: unique(items.flatMap((m) => m.subcategories)),
      keywords: unique(items.flatMap((m) => m.keywords)),
      people: unique(items.flatMap((m) => m.people)),
      dateISO: date ? toISODate(date) : "",
      date,
      precision,
      coverMediaId: coverCandidate ? coverCandidate.id : null,
      mediaIds: items
        .slice()
        .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
        .map((m) => m.id),
      photoCount,
      videoCount,
    });
  }

  events.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  void byId;
  return events;
}

function countBy(media: MediaItem[], pick: (m: MediaItem) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of media) {
    const k = pick(m);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function countByMany(media: MediaItem[], pick: (m: MediaItem) => string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of media) {
    for (const k of pick(m)) {
      if (!k) continue;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return map;
}

function sortCounted(map: Map<string, number>): Counted[] {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}