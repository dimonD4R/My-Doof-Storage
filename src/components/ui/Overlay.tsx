import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";
import { IconX } from "./icons";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "center" | "right" | "bottom";
  width?: string;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  /** Do not lock body scroll (e.g. nested sheets). */
  preventScrollLock?: boolean;
  panelClassName?: string;
}

function OverlayShell({
  open,
  onClose,
  title,
  side = "center",
  width = "max-w-md",
  children,
  footer,
  ariaLabel,
  preventScrollLock,
  panelClassName = "",
}: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    if (!preventScrollLock) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, preventScrollLock]);

  if (!open) return null;

  const panelClass =
    side === "bottom"
      ? `fixed inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-card shadow-float max-h-[88dvh] flex flex-col anim-fade-in ${panelClassName}`
      : side === "right"
        ? `fixed inset-y-0 right-0 max-w-[94vw] h-full w-full border-l border-line bg-card shadow-float flex flex-col anim-fade-in ${panelClassName}`
        : `fixed inset-0 m-auto ${width} max-h-[92dvh] w-[calc(100vw-32px)] rounded-2xl border border-line bg-card shadow-float flex flex-col anim-scale-in ${panelClassName}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-scrim/60 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === "string" ? title : "Dialog")}
        className={panelClass}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 shrink-0">
            <h2 className="text-[15px] font-semibold text-ink truncate">{title}</h2>
            <IconButton label="Close" onClick={onClose} size="sm" />
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 py-3.5 shrink-0">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

export const Overlay = OverlayShell;
export { IconX };