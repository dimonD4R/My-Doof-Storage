import type { RawDataset, RepositoryConfig } from "../types";
import { BRANCH_CANDIDATES, resolveRepositoryConfig, type RepositoryOverrides } from "./repositoryConfig";

export interface LoadResult {
  raw: RawDataset;
  repository: RepositoryConfig;
  fromCache: boolean;
}

const CACHE_KEY = "memories:dataset:v2";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6h
const FETCH_TIMEOUT = 12000;

interface CacheEntry {
  ts: number;
  repository: RepositoryConfig;
  raw: RawDataset;
}

export function readCache(): CacheEntry | null {
  try {
    const text = localStorage.getItem(CACHE_KEY);
    if (!text) return null;
    const parsed = JSON.parse(text) as CacheEntry;
    if (!parsed.raw || !parsed.repository) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isCacheFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.ts < CACHE_TTL;
}

export function writeCache(entry: Omit<CacheEntry, "ts">): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...entry, ts: Date.now() }));
  } catch {
    /* storage full — ignore, cache is best-effort */
  }
}

function localBundledUrl(): string {
  return `${import.meta.env.BASE_URL}data/MOB-Storage.json`;
}

async function fetchJson(url: string, timeoutMs: number): Promise<RawDataset | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const clone = res.clone();
    const text = await clone.text();
    if (!text.trim()) return null;
    try {
      return JSON.parse(text) as RawDataset;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Fetches the remote metadata JSON, probing candidate branches.
 * Returns null when every candidate fails.
 */
export async function fetchRemoteDataset(
  base: RepositoryConfig
): Promise<RawDataset | null> {
  if (import.meta.env.VITE_DATA_URL) {
    const raw = await fetchJson(base.dataUrl, FETCH_TIMEOUT);
    if (raw) return raw;
  }

  for (const candidate of BRANCH_CANDIDATES) {
    const branch = candidate;
    const url = `https://raw.githubusercontent.com/${base.owner}/${base.repo}/${branch}/MOB-Storage.json`;
    const raw = await fetchJson(url, FETCH_TIMEOUT);
    if (raw) return raw;
  }
  return null;
}

/** Loads the bundled local copy of the metadata JSON. */
export async function fetchLocalDataset(): Promise<RawDataset | null> {
  return fetchJson(localBundledUrl(), FETCH_TIMEOUT);
}

/**
 * Full read path used during initial resolution:
 * 1. cached dataset (instant)
 * 2. remote JSON (live, branch-probed)
 * 3. bundled local copy
 */
export function resolveBaseConfig(
  baseUrlFromData: string | undefined,
  overrides?: RepositoryOverrides
): RepositoryConfig {
  return resolveRepositoryConfig(baseUrlFromData, overrides);
}

export function sniffRepository(raw: RawDataset): RepositoryConfig | null {
  if (!raw?.baseUrl) return null;
  try {
    return resolveRepositoryConfig(raw.baseUrl, {});
  } catch {
    return null;
  }
}