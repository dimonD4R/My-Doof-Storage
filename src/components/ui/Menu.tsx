import { type ReactNode } from "react";

/** Keyboard-accessible lightweight dropdown menu. */
export function Menu({
  items,
  onClose,
  align = "right",
}: {
  items: { key: string; label: string; danger?: boolean; icon?: ReactNode; onSelect: () => void }[];
  onClose: () => void;
  align?: "left" | "right";
}) {
  return (
    <div
      role="menu"
      className={`absolute z-40 mt-1 min-w-44 rounded-xl border border-line bg-card py-1.5 shadow-float anim-pop-in ${
        align === "right" ? "right-0" : "left-0"
      }`}
      onMouseLeave={onClose}
    >
      {items.map((it) => (
        <button
          key={it.key}
          role="menuitem"
          onClick={() => {
            it.onSelect();
            onClose();
          }}
          className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors ${
            it.danger ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" : "text-ink hover:bg-card-2"
          }`}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}