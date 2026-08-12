import { useEffect, useRef, useState } from "react";
import type { DownloadReport } from "../../types";
import { useApp } from "../../state/AppStore";
import { mediaUrls } from "../../data/mediaUrlResolver";
import {
  downloadBatch,
  downloadSingle,
  type DownloadTarget,
} from "../../lib/downloads";
import { Button, Overlay, ProgressBar } from "../ui";
import { plural } from "../../utils/date";

type Stage = "preparing" | "running" | "done" | "error";

interface Props {
  targets: DownloadTarget[];
  zipName: string;
  groupDir?: string | null;
  single?: boolean;
  onClose: () => void;
}

export function DownloadDialog({ targets, zipName, groupDir, single = false, onClose }: Props) {
  const { archive, toast } = useApp();
  const config = archive?.repository;
  const [stage, setStage] = useState<Stage>("preparing");
  const [percent, setPercent] = useState(0);
  const [report, setReport] = useState<DownloadReport | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!config || started.current || targets.length === 0) return;
    started.current = true;

    if (single && targets.length === 1) {
      const t = targets[0];
      const u = config ? mediaUrls(config, t.media) : null;
      if (!u) {
        setStage("error");
        return;
      }
      setStage("running");
      const fileName = t.which === "image" ? u.image.split("/").pop()! : u.video.split("/").pop()!;
      const url = t.which === "image" ? u.image : u.video;
      void downloadSingle(url, fileName, (p) => setPercent(p))
        .then(() => {
          setPercent(100);
          setReport({ requested: 1, downloaded: 1, failed: 0, canceled: false, failedNames: [] });
          setStage("done");
          toast("Download started", "success");
        })
        .catch(() => {
          setStage("error");
          toast("Download failed — file may be unavailable", "error");
        });
      return;
    }

    setStage("running");
    void downloadBatch(
      targets,
      (t) => {
        const u = config ? mediaUrls(config, t.media) : null;
        return {
          image: u?.image ?? "",
          video: u?.video ?? "",
          fileName: t.which === "image" && u ? u.fileName : t.media.fileName,
        };
      },
      {
        zipName,
        groupDir,
        callbacks: {
          onProgress: (p) => setPercent(p),
          onFileDone: () => undefined,
        },
      }
    )
      .then((r) => {
        setReport(r);
        setStage("done");
        if (r.failed > 0) {
          toast(`${r.downloaded} of ${r.requested} downloaded${r.failed ? ` · ${r.failed} unavailable` : ""}`, r.failed ? "error" : "success");
        } else {
          toast(`${plural(r.downloaded, "file")} downloaded`, "success");
        }
      })
      .catch(() => {
        setStage("error");
        toast("Downloading failed", "error");
      });
  }, [config, targets, single, zipName, groupDir, toast]);

  return (
    <Overlay open onClose={onClose} title="Download" ariaLabel="Download memories" footer={
      stage === "done" || stage === "error" ? (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
        </div>
      ) : undefined
    }>
      <div className="p-5">
        {stage === "preparing" && (
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line-strong border-t-accent spin" aria-hidden="true" />
            <p className="text-[13px] text-ink-2">Preparing download…</p>
          </div>
        )}

        {stage === "running" && (
          <div className="space-y-3">
            <ProgressBar value={percent} max={100} label={`Creating ${single ? "" : "ZIP"}…`} />
            <p className="text-[12px] text-ink-3">
              {plural(targets.length, "file")} requested
            </p>
          </div>
        )}

        {stage === "done" && report && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-600">
                <CheckIcon />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">Download ready</p>
                <p className="text-[12px] text-ink-2">
                  {report.requested} {report.requested === 1 ? "file" : "files"} requested · {report.downloaded} downloaded
                  {report.failed > 0 && ` · ${report.failed} unavailable`}
                </p>
              </div>
            </div>
            {report.failedNames.length > 0 && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                <p className="mb-1 text-[12px] font-medium text-amber-700 dark:text-amber-400">Unavailable files</p>
                <ul className="max-h-28 space-y-0.5 overflow-y-auto text-[11px] text-ink-3">
                  {report.failedNames.map((n) => (
                    <li key={n} className="truncate">{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {stage === "error" && (
          <p className="text-[13px] text-red-600">
            Something went wrong while preparing your download. Check your connection and try again.
          </p>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-ink-3">
          {!single && "Memories are bundled into a ZIP with Photos/ and Videos/ folders. "}
          Individual downloads use full-resolution originals from the linked repository.
        </p>
      </div>
    </Overlay>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}