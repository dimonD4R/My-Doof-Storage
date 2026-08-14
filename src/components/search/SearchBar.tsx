import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppStore";
import { suggest, type SearchSuggestion } from "../../lib/search";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { IconPhoto, IconSearch, IconStar, IconTags, IconUsers } from "../ui/icons";
import { cn } from "../../utils/cn";

/** Pages that filter their own content by the `search` URL param. */
const SEARCHABLE_PAGES = new Set(["/memories", "/categories"]);

function suggestionIcon(type: SearchSuggestion["type"]) {
  switch (type) {
    case "category": return <IconTags width={14} height={14} />;
    case "subcategory": return <IconTags width={14} height={14} />;
    case "person": return <IconUsers width={14} height={14} />;
    case "keyword": return <IconStar width={14} height={14} />;
    case "year": return <IconPhoto width={14} height={14} />;
    default: return <IconSearch width={14} height={14} />;
  }
}

export function SearchBar({
  size = "md",
  autoFocus = false,
  placeholder = "Search memories...",
  onNavigate,
  className,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const { archive } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounced = useDebouncedValue(query, 140);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery("");
    setOpen(false);
  }, [location.pathname, location.search]);

  // Global shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = open && debounced.trim() ? suggest(archive, debounced) : [];

  const go = (q: string) => {
    const trimmed = q.trim();
    setOpen(false);
    if (!trimmed) return;
    onNavigate?.();
    // Preserve any active URL filters (e.g. a category, event, collection) so a
    // search stays scoped to the current view instead of resetting it. Also stay
    // on the current page when it supports search (e.g. Categories) rather than
    // always jumping to Memories.
    const params = new URLSearchParams(location.search);
    params.set("search", trimmed);
    const target = SEARCHABLE_PAGES.has(location.pathname) ? location.pathname : "/memories";
    navigate(`${target}?${params.toString()}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(query);
  };

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <form onSubmit={onSubmit} role="search">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-full border transition-colors",
            focused ? "border-ink-3 bg-card" : "border-line bg-card",
            size === "lg" ? "h-12 px-4" : "h-9.5 px-3.5"
          )}
        >
          <IconSearch width={size === "lg" ? 18 : 15} height={size === "lg" ? 18 : 15} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-label="Search memories"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line bg-card-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-3 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-card py-1.5 shadow-float anim-pop-in">
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.label}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(s.label)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] hover:bg-card-2"
              >
                <span className="text-ink-3">{suggestionIcon(s.type)}</span>
                <span className="flex-1 truncate font-medium text-ink">{s.label}</span>
                {s.hint && <span className="text-[11px] text-ink-3">{s.hint}</span>}
                {s.type === "recent" && (
                  <span className="text-[10px] uppercase tracking-wide text-ink-3">Recent</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}