/** Safe localStorage JSON helpers. */

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function uid(prefix = ""): string {
  let s = "";
  const bytes = new Uint8Array(9);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  } else {
    s = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  return prefix + s;
}