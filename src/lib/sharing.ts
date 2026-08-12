import type { SharePayload, SharePermissions } from "../types";

const PERM_KEYS: (keyof SharePermissions)[] = [
  "viewPhotos",
  "viewVideos",
  "downloadMedia",
  "originalQuality",
];

function compactIds(ids: string[]): string {
  if (!ids.length) return "";
  const numeric = ids.every((i) => /^\d+$/.test(i));
  if (!numeric) return ids.join(",");
  const nums = ids.map(Number).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = nums[0];
  let prev = nums[0];
  for (let i = 1; i <= nums.length; i++) {
    const cur = nums[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push(start === prev ? String(start) : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  return ranges.join(",");
}

function expandIds(compact: string): string[] {
  if (!compact) return [];
  const out = new Set<string>();
  for (const part of compact.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const dash = p.indexOf("-");
    if (dash > 0) {
      const [a, b] = [Number(p.slice(0, dash)), Number(p.slice(dash + 1))];
      if (isFinite(a) && isFinite(b) && b >= a) {
        for (let i = a; i <= b; i++) out.add(String(i));
        continue;
      }
    }
    out.add(p);
  }
  return Array.from(out);
}

function b64encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64decode(str: string): string {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeToken(
  kind: SharePayload["kind"],
  targetId: string,
  name: string,
  description: string,
  mediaIds: string[],
  permissions: SharePermissions,
  passwordHash?: string,
  expiresAt?: number | null
): string {
  const payload: SharePayload = {
    v: 1,
    kind,
    targetId,
    name: name.slice(0, 80),
    description: description.slice(0, 500),
    mediaIds: compactIds(mediaIds),
    permissions,
    passwordHash,
    expiresAt,
  };
  return b64encode(JSON.stringify(payload));
}

export function decodeToken(token: string): SharePayload | null {
  try {
    const parsed = JSON.parse(b64decode(token.trim())) as SharePayload;
    if (parsed.v !== 1 || !parsed.kind || !parsed.mediaIds) return null;
    return {
      ...parsed,
      mediaIds: Array.isArray(parsed.mediaIds) ? parsed.mediaIds : expandIds(String(parsed.mediaIds)),
    };
  } catch {
    return null;
  }
}

/** IDs are also encoded compactly inside the payload. */
export function decodePayloadIds(payload: SharePayload): string[] {
  if (Array.isArray(payload.mediaIds)) {
    const allString = payload.mediaIds.every((x) => typeof x === "string");
    if (allString) return payload.mediaIds as string[];
  }
  return expandIds(String(payload.mediaIds));
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newShareId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function permFlags(p: SharePermissions): string {
  return PERM_KEYS.map((k) => (p[k] ? "1" : "0")).join("");
}

export const defaultPermissions = (): SharePermissions => ({
  viewPhotos: true,
  viewVideos: true,
  downloadMedia: true,
  originalQuality: true,
});