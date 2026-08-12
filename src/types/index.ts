/** Raw shape as it appears in the GitHub metadata JSON. */
export interface RawDataset {
  version?: string;
  baseUrl?: string;
  videos?: RawMedia[];
}

export interface RawMedia {
  id: string;
  title: string;
  video?: string;
  Image?: string;
  image?: string;
  category?: string;
  subcategories?: string[];
  keywords?: string[];
}

export type MediaType = "photo" | "video" | "both";

/** Normalized memory used throughout the app. */
export interface MediaItem {
  id: string;
  title: string;
  /** Parsed ISO date, or "" when the title did not contain a parseable date. */
  dateISO: string;
  /** Date object, or null when unavailable. */
  date: Date | null;
  imagePath: string;
  videoPath: string;
  hasImage: boolean;
  hasVideo: boolean;
  mediaType: MediaType;
  category: string;
  subcategories: string[];
  keywords: string[];
  /** Detected people derived from keywords/subcategories. */
  people: string[];
  /** Base file name without directory. */
  fileName: string;
  /** Original record index in the source dataset. */
  sourceIndex: number;
}

export interface Counted {
  name: string;
  count: number;
}

/** A derived, read-only archive built once from the dataset. */
export interface Archive {
  version: string;
  repository: RepositoryConfig;
  media: MediaItem[];
  categories: Counted[];
  subcategories: Counted[];
  keywords: Counted[];
  years: number[];
  people: Counted[];
  events: MemoryEvent[];
  mediaByEventId: Map<string, MediaItem[]>;
  byId: Map<string, MediaItem>;
}

export interface RepositoryConfig {
  owner: string;
  repo: string;
  branch: string;
  /** Full https path to the metadata JSON. */
  dataUrl: string;
  /** Base raw URL for media (branches-appended). */
  rawBase: string;
  /** jsDelivr CDN base for fast, cached media serving. */
  cdnBase: string;
  /** Base media URL for image/video display (jsDelivr CDN). */
  mediaBase: string;
  githubUrl: string;
}

export type DatePrecision = "day" | "month" | "year";

export interface MemoryEvent {
  id: string;
  title: string;
  category: string;
  subcategories: string[];
  keywords: string[];
  people: string[];
  dateISO: string;
  /** Display date (may be a month or year only for non-specific dates). */
  date: Date | null;
  precision: DatePrecision;
  coverMediaId: string | null;
  mediaIds: string[];
  photoCount: number;
  videoCount: number;
}

// ---------------------------------------------------------------------------
// User state (persisted locally)
// ---------------------------------------------------------------------------

export interface Collection {
  id: string;
  name: string;
  description: string;
  coverMediaId: string | null;
  mediaIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ShareLink {
  id: string;
  token: string;
  displayName: string;
  kind: "collection" | "event";
  targetId: string;
  permissions: SharePermissions;
  createdAt: number;
  expiresAt: number | null;
  views: number;
}

export interface SharePayload {
  v: 1;
  kind: "collection" | "event";
  targetId: string;
  name: string;
  description: string;
  /** Compact id list (e.g. "1-30,35") or expanded array when decoded. */
  mediaIds: string | string[];
  permissions: SharePermissions;
  /** Optional hash of a password used as a soft client-side gate. */
  passwordHash?: string;
  /** Expiry timestamp (ms). Absent/undefined means "never". */
  expiresAt?: number | null;
}

export interface SharePermissions {
  viewPhotos: boolean;
  viewVideos: boolean;
  downloadMedia: boolean;
  originalQuality: boolean;
}

export type GalleryView = "grid" | "comfortable" | "masonry" | "timeline";

export type SortKey =
  | "newest"
  | "oldest"
  | "recentlyAdded"
  | "nameAsc"
  | "nameDesc"
  | "category";

export interface Filters {
  search: string;
  years: number[];
  months: number[];
  categories: string[];
  subcategories: string[];
  keywords: string[];
  people: string[];
  mediaTypes: MediaType[];
  miniVideoFilter: "all" | "withVideo" | "withoutVideo";
  favoritesOnly: boolean;
  collectionId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export const EMPTY_FILTERS: Filters = {
  search: "",
  years: [],
  months: [],
  categories: [],
  subcategories: [],
  keywords: [],
  people: [],
  mediaTypes: [],
  miniVideoFilter: "all",
  favoritesOnly: false,
  collectionId: null,
  dateFrom: null,
  dateTo: null,
};

export interface Toast {
  id: string;
  message: string;
  tone: "neutral" | "success" | "error";
}

export interface DownloadReport {
  requested: number;
  downloaded: number;
  failed: number;
  canceled: boolean;
  failedNames: string[];
}