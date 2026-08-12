import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Archive,
  Collection,
  GalleryView,
  MediaItem,
  ShareLink,
  SharePermissions,
  SortKey,
  Toast,
} from "../types";
import { normalizeDataset } from "../data/dataNormalizer";
import {
  fetchLocalDataset,
  fetchRemoteDataset,
  isCacheFresh,
  readCache,
  resolveBaseConfig,
  writeCache,
} from "../data/dataLoader";
import { encodeToken } from "../lib/sharing";
import { loadJSON, removeKey, saveJSON, uid } from "../utils/storage";

export type Theme = "light" | "dark" | "system";
export type DatasetStatus = "loading" | "ready" | "error";

export interface LightboxState {
  items: MediaItem[];
  index: number;
  source: "archive" | "share";
}

interface Prefs {
  galleryView: GalleryView;
  sortKey: SortKey;
}

interface AppStoreValue {
  status: DatasetStatus;
  archive: Archive | null;
  loadFailed: boolean;
  refresh: () => Promise<void>;
  toast: (message: string, tone?: Toast["tone"]) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;

  favorites: ReadonlySet<string>;
  favoriteCount: number;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addFavorites: (ids: string[]) => void;
  clearFavorites: () => void;

  collections: Collection[];
  createCollection: (input: {
    name: string;
    description: string;
    coverMediaId: string | null;
    mediaIds?: string[];
  }) => Collection;
  updateCollection: (id: string, patch: Partial<Omit<Collection, "id" | "createdAt">>) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, mediaIds: string[]) => void;
  removeFromCollection: (collectionId: string, mediaIds: string[]) => void;

  recentIds: string[];
  addRecent: (media: MediaItem) => void;
  clearRecent: () => void;

  prefs: Prefs;
  setView: (v: GalleryView) => void;
  setSort: (s: SortKey) => void;

  shareLinks: ShareLink[];
  createShareLink: (input: {
    kind: "collection" | "event";
    targetId: string;
    name: string;
    description: string;
    mediaIds: string[];
    permissions: SharePermissions;
    passwordHash?: string;
    expiresAt?: number | null;
  }) => ShareLink;
  revokeShareLink: (id: string) => void;
  recordShareView: (token: string) => void;

  lightbox: LightboxState | null;
  openLightbox: (items: MediaItem[], index: number, source?: LightboxState["source"]) => void;
  closeLightbox: () => void;
  lightboxPrev: () => void;
  lightboxNext: () => void;
  lightboxSeek: (i: number) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

const PREFS_KEY = "memories:prefs";
const FAV_KEY = "memories:favorites";
const COLL_KEY = "memories:collections";
const RECENT_KEY = "memories:recent";
const SHARE_KEY = "memories:shares";
const THEME_KEY = "memories:theme";

function defaultPrefs(): Prefs {
  return { galleryView: "grid", sortKey: "oldest" };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#12120f" : "#faf9f5");
}

const toastDefaultTone: Toast["tone"] = "neutral";

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DatasetStatus>("loading");
  const [archive, setArchive] = useState<Archive | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    return saved && ["light", "dark", "system"].includes(saved) ? saved : "system";
  });

  const [favorites, setFavorites] = useState<ReadonlySet<string>>(
    () => new Set(loadJSON<string[]>(FAV_KEY, []))
  );
  const [collections, setCollections] = useState<Collection[]>(() =>
    loadJSON<Collection[]>(COLL_KEY, [])
  );
  const [recentIds, setRecentIds] = useState<string[]>(() => loadJSON<string[]>(RECENT_KEY, []));
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(() =>
    loadJSON<ShareLink[]>(SHARE_KEY, [])
  );
  const [prefs, setPrefs] = useState<Prefs>(() => ({ ...defaultPrefs(), ...loadJSON<Partial<Prefs>>(PREFS_KEY, {}) }));

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const toastTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, tone: Toast["tone"] = toastDefaultTone) => {
      const id = uid("toast-");
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      toastTimers.current.set(
        id,
        setTimeout(() => dismissToast(id), 3800)
      );
    },
    [dismissToast]
  );

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    saveJSON(FAV_KEY, Array.from(favorites));
  }, [favorites]);
  useEffect(() => {
    saveJSON(COLL_KEY, collections);
  }, [collections]);
  useEffect(() => {
    saveJSON(RECENT_KEY, recentIds);
  }, [recentIds]);
  useEffect(() => {
    saveJSON(SHARE_KEY, shareLinks);
  }, [shareLinks]);
  useEffect(() => {
    saveJSON(PREFS_KEY, prefs);
  }, [prefs]);

  // ---- Data loading -------------------------------------------------------
  const loadFromCache = useCallback((): Archive | null => {
    const cached = readCache();
    if (!cached) return null;
    try {
      const config = resolveBaseConfig(cached.raw.baseUrl, { branch: cached.repository.branch });
      return normalizeDataset(cached.raw, config);
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const cached = readCache();
    const baseConfig = resolveBaseConfig(cached?.raw.baseUrl);
    const remote = await fetchRemoteDataset(baseConfig);
    if (remote) {
      const config = resolveBaseConfig(remote.baseUrl, { branch: baseConfig.branch });
      const arch = normalizeDataset(remote, config);
      setArchive(arch);
      writeCache({ repository: config, raw: remote });
      setStatus("ready");
      setLoadFailed(false);
      return;
    }
    const local = await fetchLocalDataset();
    if (local) {
      const config = resolveBaseConfig(local.baseUrl, { branch: baseConfig.branch });
      setArchive(normalizeDataset(local, config));
      setStatus("ready");
      setLoadFailed(false);
      return;
    }
    setStatus("error");
    setLoadFailed(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      let arch: Archive | null = null;
      const cached = readCache();
      if (cached && isCacheFresh(cached)) {
        arch = loadFromCache();
        if (arch && !cancelled) {
          setArchive(arch);
          setStatus("ready");
        }
      }
      const baseConfig = resolveBaseConfig(cached?.raw.baseUrl);
      const remote = await fetchRemoteDataset(baseConfig);
      if (cancelled) return;
      if (remote) {
        const config = resolveBaseConfig(remote.baseUrl, { branch: baseConfig.branch });
        const arch = normalizeDataset(remote, config);
        setArchive(arch);
        writeCache({ repository: config, raw: remote });
        setStatus("ready");
        setLoadFailed(false);
        return;
      }
      if (!arch && !cancelled) {
        const local = await fetchLocalDataset();
        if (cancelled) return;
        if (local) {
          const config = resolveBaseConfig(local.baseUrl, { branch: baseConfig.branch });
          setArchive(normalizeDataset(local, config));
          setStatus("ready");
          setLoadFailed(false);
          return;
        }
        setStatus("error");
        setLoadFailed(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadFromCache]);

  // ---- Favorites ----------------------------------------------------------
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addFavorites = useCallback((ids: string[]) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      ids.forEach((i) => next.add(i));
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => setFavorites(new Set()), []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  // ---- Collections --------------------------------------------------------
  const createCollection = useCallback(
    (input: {
      name: string;
      description: string;
      coverMediaId: string | null;
      mediaIds?: string[];
    }): Collection => {
      const now = Date.now();
      const coll: Collection = {
        id: uid("col-"),
        name: input.name.trim() || "Untitled collection",
        description: input.description.trim(),
        coverMediaId: input.coverMediaId,
        mediaIds: Array.from(new Set(input.mediaIds ?? [])),
        createdAt: now,
        updatedAt: now,
      };
      setCollections((prev) => [coll, ...prev]);
      return coll;
    },
    []
  );

  const updateCollection = useCallback(
    (id: string, patch: Partial<Omit<Collection, "id" | "createdAt">>) => {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c))
      );
    },
    []
  );

  const deleteCollection = useCallback(
    (id: string) => {
      setCollections((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  const addToCollection = useCallback((collectionId: string, mediaIds: string[]) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              mediaIds: Array.from(new Set([...c.mediaIds, ...mediaIds])),
              coverMediaId: c.coverMediaId ?? mediaIds[0] ?? null,
              updatedAt: Date.now(),
            }
          : c
      )
    );
  }, []);

  const removeFromCollection = useCallback((collectionId: string, mediaIds: string[]) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, mediaIds: c.mediaIds.filter((x) => !mediaIds.includes(x)), updatedAt: Date.now() }
          : c
      )
    );
  }, []);

  // ---- Recent -------------------------------------------------------------
  const addRecent = useCallback((media: MediaItem) => {
    setRecentIds((prev) => {
      const next = [media.id, ...prev.filter((x) => x !== media.id)];
      return next.slice(0, 20);
    });
  }, []);

  const clearRecent = useCallback(() => setRecentIds([]), []);

  // ---- Prefs --------------------------------------------------------------
  const setView = useCallback((v: GalleryView) => setPrefs((p) => ({ ...p, galleryView: v })), []);
  const setSort = useCallback((s: SortKey) => setPrefs((p) => ({ ...p, sortKey: s })), []);

  // ---- Sharing ------------------------------------------------------------
  const createShareLink = useCallback(
    (input: {
      kind: "collection" | "event";
      targetId: string;
      name: string;
      description: string;
      mediaIds: string[];
      permissions: SharePermissions;
      passwordHash?: string;
      expiresAt?: number | null;
    }): ShareLink => {
      const token = encodeToken(
        input.kind,
        input.targetId,
        input.name,
        input.description,
        input.mediaIds,
        input.permissions,
        input.passwordHash,
        input.expiresAt ?? null
      );
      const link: ShareLink = {
        id: uid("sh-"),
        token,
        displayName: input.name,
        kind: input.kind,
        targetId: input.targetId,
        permissions: input.permissions,
        createdAt: Date.now(),
        expiresAt: input.expiresAt ?? null,
        views: 0,
      };
      setShareLinks((prev) => [link, ...prev]);
      return link;
    },
    []
  );

  const revokeShareLink = useCallback((id: string) => {
    setShareLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const recordShareView = useCallback((token: string) => {
    setShareLinks((prev) =>
      prev.map((l) => (l.token === token ? { ...l, views: l.views + 1 } : l))
    );
  }, []);

  // ---- Lightbox -----------------------------------------------------------
  const openLightbox = useCallback(
    (items: MediaItem[], index: number, source: LightboxState["source"] = "archive") => {
      setLightbox({ items, index, source });
      const it = items[index];
      if (it) addRecent(it);
    },
    [addRecent]
  );
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const lightboxPrev = useCallback(
    () => setLightbox((l) => (l ? { ...l, index: (l.index - 1 + l.items.length) % l.items.length } : l)),
    []
  );
  const lightboxNext = useCallback(
    () => setLightbox((l) => (l ? { ...l, index: (l.index + 1) % l.items.length } : l)),
    []
  );
  const lightboxSeek = useCallback((i: number) => setLightbox((l) => (l ? { ...l, index: i } : l)), []);

  const value = useMemo<AppStoreValue>(
    () => ({
      status,
      archive,
      loadFailed,
      refresh,
      toast,
      toasts,
      dismissToast,
      theme,
      setTheme: setThemeState,
      favorites,
      favoriteCount: favorites.size,
      toggleFavorite,
      isFavorite,
      addFavorites,
      clearFavorites,
      collections,
      createCollection,
      updateCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
      recentIds,
      addRecent,
      clearRecent,
      prefs,
      setView,
      setSort,
      shareLinks,
      createShareLink,
      revokeShareLink,
      recordShareView,
      lightbox,
      openLightbox,
      closeLightbox,
      lightboxPrev,
      lightboxNext,
      lightboxSeek,
    }),
    [
      status, archive, loadFailed, refresh, toast, toasts, dismissToast, theme,
      favorites, toggleFavorite, isFavorite, addFavorites, clearFavorites, collections, createCollection,
      updateCollection, deleteCollection, addToCollection, removeFromCollection, recentIds,
      addRecent, clearRecent, prefs, setView, setSort, shareLinks, createShareLink,
      revokeShareLink, recordShareView, lightbox, openLightbox, closeLightbox,
      lightboxPrev, lightboxNext, lightboxSeek,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useApp(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useApp must be used within AppStoreProvider");
  return ctx;
}

/** Builds the public URL for a shared token. */
export function buildShareUrl(base: string, token: string): string {
  const origin =
    base && base.startsWith("http")
      ? new URL(base, window.location.href).origin + window.location.pathname
      : window.location.href;
  const url = new URL(origin);
  url.hash = `#/share/${token}`;
  return url.toString();
}

export { removeKey };