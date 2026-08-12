import type { Archive } from "../types";

export interface SearchSuggestion {
  type: "category" | "subcategory" | "keyword" | "person" | "year" | "recent";
  label: string;
  hint?: string;
}

const RECENT_KEY = "memories:recent-searches";

export function getRecentSearches(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? raw.slice(0, 6).map(String) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(q: string): void {
  const trimmed = q.trim();
  if (!trimmed) return;
  const list = [trimmed, ...getRecentSearches().filter((x) => x.toLowerCase() !== trimmed.toLowerCase())];
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

/** Builds ranked suggestions for a partial query. */
export function suggest(archive: Archive | null, query: string): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return getRecentSearches().map((label) => ({ type: "recent", label }));
  }
  if (!archive) return [];

  const out: SearchSuggestion[] = [];
  const seen = new Set<string>();

  const push = (type: SearchSuggestion["type"], label: string, hint?: string) => {
    const key = `${type}:${label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ type, label, hint });
  };

  if (`${new Date().getFullYear()}`.includes(q)) {
    push("year", String(new Date().getFullYear()), "This year");
  }

  const limit = (n: number) => Math.min(out.length + n, 16);

  for (const c of archive.categories) {
    if (out.length >= limit(0)) break;
    if (c.name.toLowerCase().includes(q)) push("category", c.name, `${c.count} memories`);
  }
  for (const s of archive.subcategories) {
    if (out.length >= limit(2)) break;
    if (s.name.toLowerCase().includes(q)) push("subcategory", s.name, `${s.count} memories`);
  }
  for (const p of archive.people) {
    if (out.length >= limit(4)) break;
    if (p.name.toLowerCase().includes(q)) push("person", p.name, `${p.count} memories`);
  }
  for (const k of archive.keywords) {
    if (out.length >= limit(6)) break;
    if (k.name.toLowerCase().includes(q)) push("keyword", k.name, `${k.count} memories`);
  }
  for (const y of archive.years) {
    if (out.length >= limit(10)) break;
    if (String(y).includes(q)) push("year", String(y), undefined);
  }

  // Media-title matches.
  for (const m of archive.media) {
    if (out.length >= 16) break;
    if (m.title.toLowerCase().includes(q) && m.date) {
      push("keyword", m.title, "Memory");
    }
  }
  return out;
}

export function recentSearchSource(): string[] {
  return getRecentSearches();
}