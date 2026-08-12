import type { ReactNode } from "react";
import type { Toast } from "../../types";
import { IconCheck, IconWarning, IconInfo } from "./icons";

export function SkeletonTile() {
  return (
    <div className="aspect-square overflow-hidden rounded-xl skeleton" role="status" aria-label="Loading" />
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTile key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-card/50 px-6 py-16 text-center">
      {icon && <div className="text-ink-3">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {message && <p className="max-w-sm text-[13px] leading-relaxed text-ink-2">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-card px-6 py-16 text-center">
      <div className="text-ink-3"><IconWarning width={28} height={28} /></div>
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {message && <p className="max-w-md text-[13px] leading-relaxed text-ink-2">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[13px] font-medium text-accent-ink"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[12px] text-ink-2">
          <span>{label}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`anim-toast pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] shadow-float ${
            t.tone === "success"
              ? "border-emerald-600/30 bg-emerald-700 text-emerald-50"
              : t.tone === "error"
                ? "border-red-600/40 bg-red-700 text-red-50"
                : "border-line bg-card text-ink"
          }`}
        >
          {t.tone === "success" && <IconCheck width={16} height={16} />}
          {t.tone === "error" && <IconWarning width={16} height={16} />}
          {t.tone === "neutral" && <IconInfo width={16} height={16} className="text-ink-3" />}
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}