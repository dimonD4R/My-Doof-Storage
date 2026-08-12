import type { RepositoryConfig } from "../types";

export interface RepositoryOverrides {
  owner?: string;
  repo?: string;
  branch?: string;
  dataUrl?: string;
}

/**
 * Builds the repository / media host configuration.
 *
 * The metadata JSON carries a `baseUrl` (e.g.
 * https://github.com/dimonD4R/Web-My-Personal-Photos-Videos) which is used as
 * the source of truth. Overrides (env vars / future settings) take precedence.
 */
export function resolveRepositoryConfig(
  baseUrl?: string,
  overrides: RepositoryOverrides = {}
): RepositoryConfig {
  const envUrl = import.meta.env.VITE_DATA_URL;

  let owner = overrides.owner ?? "dimonD4R";
  let repo = overrides.repo ?? "Web-My-Personal-Photos-Videos";
  let branch = overrides.branch ?? "main";

  if (!overrides.owner && baseUrl) {
    const parsed = parseGitHubUrl(baseUrl);
    if (parsed) {
      owner = parsed.owner;
      repo = parsed.repo;
    }
  }

  const dataUrl =
    overrides.dataUrl ??
    (envUrl !== undefined && envUrl.trim() ? envUrl.trim() : null);

  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  // jsDelivr is a global CDN for GitHub files: cached, no per-IP rate limits,
  // supports Range requests (video seeking) and files up to 20 MB. This is the
  // primary host for images/videos. raw.githubusercontent.com is kept as the
  // fallback (downloads) and for the metadata probing in dataLoader.
  const cdnBase = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/`;

  return {
    owner,
    repo,
    branch,
    dataUrl: dataUrl || `${rawBase}MOB-Storage.json`,
    rawBase,
    cdnBase,
    mediaBase: cdnBase,
    githubUrl: `https://github.com/${owner}/${repo}`,
  };
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    const m = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (m.length >= 2 && m[0] && m[1]) return { owner: m[0], repo: m[1] };
  } catch {
    /* ignore */
  }
  return null;
}

/** Candidate branch names to probe when the configured branch is wrong. */
export const BRANCH_CANDIDATES = ["main", "master", "gh-pages"];