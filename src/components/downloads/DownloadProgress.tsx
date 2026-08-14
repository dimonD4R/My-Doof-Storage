import { useEffect, useState } from "react";
import { subscribeDownloads, type DownloadProgressState } from "../../lib/downloads";
import { IconDownload } from "../ui/icons";

const IDLE: DownloadProgressState = { active: false, fileName: "", percent: 0 };

/**
 * Floating pill shown while any single-file download is in flight. Lives in App
 * so it appears on both the private app and share pages.
 */
export function DownloadProgress() {
  const [state, setState] = useState<DownloadProgressState>(IDLE);

  useEffect(() => subscribeDownloads(setState), []);

  if (!state.active) return null;

  const done = state.percent >= 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-[80] w-[320px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-line bg-card p-3 shadow-float anim-pop-in lg:bottom-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconDownload width={16} height={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-ink">
            {done ? "Saved to downloads" : "Downloading"}
          </p>
          <p className="truncate text-[11.5px] text-ink-3">{state.fileName}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line-strong/60">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${Math.max(4, state.percent)}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-ink-2">
          {state.percent}%
        </span>
      </div>
    </div>
  );
}