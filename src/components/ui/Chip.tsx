import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  trailing?: ReactNode;
}

/** A small selectable chip used in filters and keyword clouds. */
export function Chip({ selected, trailing, className = "", children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
        selected
          ? "border-accent bg-accent text-accent-ink"
          : "border-line-strong bg-card text-ink-2 hover:border-ink-3 hover:text-ink"
      } ${className}`}
      {...rest}
    >
      {children}
      {trailing}
    </button>
  );
}

interface StatChipProps {
  children: ReactNode;
  count?: number;
  active?: boolean;
}

export function StatChip({ children, count, active }: StatChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line bg-card text-ink-2"
      }`}
    >
      <span className="font-medium">{children}</span>
      {count != null && (
        <span className={`text-xs tabular-nums ${active ? "opacity-70" : "opacity-60"}`}>
          {count}
        </span>
      )}
    </div>
  );
}