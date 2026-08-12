/** Parses a date from the memory title (e.g. "2026-07-01 15:04", "20260715 134057"). */
export function parseDateFromTitle(title: string): Date | null {
  if (!title) return null;
  let t = title.trim();

  const dashMatch = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s*[T ]\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dashMatch) {
    const [, y, mo, d, hh, mm, ss] = dashMatch;
    return makeDate(y, mo, d, hh, mm, ss);
  }

  const compactMatch = t.match(/^(\d{4})(\d{2})(\d{2})\s*(?:[-_ ]?(\d{2})(\d{2})(\d{2})?)?/);
  if (compactMatch) {
    const [, y, mo, d, hh, mm, ss] = compactMatch;
    return makeDate(y, mo, d, hh, mm, ss);
  }

  const yearOnly = t.match(/^(\d{4})$/);
  if (yearOnly) {
    const dt = new Date(Number(yearOnly[1]), 0, 1);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

function makeDate(
  y: string,
  mo: string,
  d: string,
  hh?: string,
  mm?: string,
  ss?: string
): Date | null {
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh ?? 0),
    Number(mm ?? 0),
    Number(ss ?? 0)
  );
  return isNaN(dt.getTime()) ? null : dt;
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthName(m: number, short = false): string {
  return (short ? MONTHS_SHORT : MONTHS)[m];
}

export function formatDate(d: Date | null, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!d || isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

export function formatDateShort(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "Unknown";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatMonthYear(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "Unknown";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Groups a sorted list by day key (ISO date). */
export function groupByDay(
  items: { date: Date | null; id: string }[]
): { key: string; date: Date | null; ids: string[] }[] {
  const map = new Map<string, { key: string; date: Date | null; ids: string[] }>();
  for (const it of items) {
    if (!it.date) continue;
    const key = toISODate(it.date);
    let g = map.get(key);
    if (!g) {
      g = { key, date: it.date, ids: [] };
      map.set(key, g);
    }
    g.ids.push(it.id);
  }
  return Array.from(map.values());
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}