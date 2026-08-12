import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { type Filters, EMPTY_FILTERS, type MediaItem } from "../types";
import { applyFilters, queryHasContent } from "../lib/filtering";
import { useApp } from "../state/AppStore";

/** Reads filter state from URL search params. */
export function filtersFromUrl(params: URLSearchParams): Filters {
  const pick = (key: string): string[] => params.getAll(key);
  return {
    search: params.get("search") ?? "",
    years: pick("year").map(Number).filter((n) => !isNaN(n)),
    months: pick("month").map(Number).filter((n) => !isNaN(n)),
    categories: pick("category"),
    subcategories: pick("subcategory"),
    keywords: pick("keyword"),
    people: pick("person"),
    mediaTypes: pick("type").filter((t) => ["photo", "video", "both"].includes(t)) as MediaItem["mediaType"][],
    miniVideoFilter: (params.get("hasVideo") as "all" | "withVideo" | "withoutVideo") ?? "all",
    favoritesOnly: params.get("fav") === "1",
    collectionId: params.get("col"),
    dateFrom: params.get("from"),
    dateTo: params.get("to"),
  };
}

/** Writes filter state into URL search params (string/number arrays become repeated params). */
export function writeFiltersToUrl(params: URLSearchParams, f: Filters): void {
  const removeAll = (key: string) => {
    for (const k of Array.from(params.keys())) if (k === key) params.delete(k);
  };

  removeAll("search");
  removeAll("year");
  removeAll("month");
  removeAll("category");
  removeAll("subcategory");
  removeAll("keyword");
  removeAll("person");
  removeAll("type");
  removeAll("hasVideo");
  removeAll("fav");
  removeAll("col");
  removeAll("from");
  removeAll("to");

  if (f.search.trim()) params.set("search", f.search.trim());
  f.years.forEach((y) => params.append("year", String(y)));
  f.months.forEach((m) => params.append("month", String(m)));
  f.categories.forEach((c) => params.append("category", c));
  f.subcategories.forEach((s) => params.append("subcategory", s));
  f.keywords.forEach((k) => params.append("keyword", k));
  f.people.forEach((p) => params.append("person", p));
  f.mediaTypes.forEach((t) => params.append("type", t));
  if (f.miniVideoFilter !== "all") params.set("hasVideo", f.miniVideoFilter);
  if (f.favoritesOnly) params.set("fav", "1");
  if (f.collectionId) params.set("col", f.collectionId);
  if (f.dateFrom) params.set("from", f.dateFrom);
  if (f.dateTo) params.set("to", f.dateTo);
}

export function useArchiveFilters() {
  const { archive, favorites, collections } = useApp();
  const location = useLocation();

  const initial = useMemo(() => {
    return filtersFromUrl(new URLSearchParams(location.search));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = useState<Filters>(initial);
  const [hasUrlSync, setHasUrlSync] = useState(false);

  // Rehydrate when the URL changes via navigation (e.g. the global search bar).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters(filtersFromUrl(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const syncUrl = useCallback(
    (f: Filters) => {
      if (!hasUrlSync) return;
      // Routing is hash-based (share links use #/share/:token), so query params
      // must live *inside* the hash, not in window.location.search.
      const qp = new URLSearchParams();
      writeFiltersToUrl(qp, f);
      const qs = qp.toString();
      const hashPath = window.location.hash.replace(/^#/, "").split("?")[0] || "/";
      window.history.replaceState(null, "", `#${hashPath}${qs ? `?${qs}` : ""}`);
    },
    [hasUrlSync]
  );

  useEffect(() => {
    setHasUrlSync(true);
  }, []);

  useEffect(() => {
    syncUrl(filters);
  }, [filters, syncUrl]);

  const patch = useCallback((p: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...p }));
  }, []);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const results = useMemo(() => {
    if (!archive) return [];
    return applyFilters(archive.media, filters, { favorites, collections });
  }, [archive, filters, favorites, collections]);

  const activeCount = useMemo(() => {
    let n = filters.years.length + filters.months.length + filters.categories.length;
    n += filters.subcategories.length + filters.keywords.length + filters.people.length;
    n += filters.mediaTypes.length;
    if (filters.miniVideoFilter !== "all") n += 1;
    if (filters.favoritesOnly) n += 1;
    if (filters.collectionId) n += 1;
    if (filters.search.trim()) n += 1;
    if (filters.dateFrom || filters.dateTo) n += 1;
    return n;
  }, [filters]);

  const isActive = queryHasContent(filters);

  return { filters, patch, reset, results, activeCount, isActive, archive };
}