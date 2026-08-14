import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { MediaItem, SharePermissions } from "../../types";
import { buildShareUrl, useApp } from "../../state/AppStore";
import { defaultPermissions, sha256Hex } from "../../lib/sharing";
import { Button, IconButton, Overlay } from "../ui";
import {
  IconCheck,
  IconCopy,
  IconQr,
  IconShare,
  IconTrash,
} from "../ui/icons";
import { cn } from "../../utils/cn";

interface Props {
  kind: "collection" | "event" | "category";
  targetId: string;
  name: string;
  about: string;
  media: MediaItem[];
  onClose: () => void;
}

type View = "options" | "result";

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left"
    >
      <span>
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        <span className="block text-[12px] text-ink-3">{desc}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-card-2"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function ShareModal({ kind, targetId, name, about, media, onClose }: Props) {
  const { createShareLink, shareLinks, revokeShareLink, recordShareView, toast } = useApp();
  const [view, setView] = useState<View>("options");
  const [perms, setPerms] = useState<SharePermissions>(defaultPermissions());
  const [access, setAccess] = useState<"anyone" | "password">("anyone");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [expiry, setExpiry] = useState<"never" | "7" | "30">("never");
  const [result, setResult] = useState<{ token: string; url: string } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const ids = media.map((m) => m.id).sort((a, b) => (Number(a) || 0) - (Number(b) || 0));

  const existingLinks = useMemo(
    () => shareLinks.filter((l) => l.kind === kind && l.targetId === targetId),
    [shareLinks, kind, targetId]
  );

  const canGenerate = media.length > 0;

  const generate = async () => {
    if (!canGenerate) {
      toast("This selection is empty — nothing to share.");
      return;
    }
    if (access === "password") {
      if (password.length < 4) {
        toast("Password must be at least 4 characters.", "error");
        return;
      }
      if (password !== password2) {
        toast("Passwords do not match.", "error");
        return;
      }
    }
    const expiresAt =
      expiry === "7" ? Date.now() + 7 * 86400000
      : expiry === "30" ? Date.now() + 30 * 86400000
      : null;

    const passwordHash =
      access === "password" && password ? await sha256Hex(password) : undefined;

const link = createShareLink({
      kind,
      targetId,
      name,
      description: about,
      mediaIds: ids,
      permissions: perms,
      passwordHash,
      expiresAt,
    });
    const url = buildShareUrl(window.location.href, link.token);
    setResult({ token: link.token, url });
    setView("result");
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      recordShareView(result.token);
      toast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy — press and hold to copy manually");
    }
  };

  return (
    <Overlay open onClose={onClose} title="Share" ariaLabel="Share memories">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <IconShare width={19} height={19} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-ink">{name}</h3>
            <p className="truncate text-[12px] text-ink-3">
              {about || `Shared memories`} · {media.length} {media.length === 1 ? "memory" : "memories"}
            </p>
          </div>
        </div>

        {view === "options" && (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Who can access?
              </legend>
              <div className="flex gap-2">
                {(["anyone", "password"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAccess(a)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors",
                      access === a
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line text-ink-2 hover:border-line-strong"
                    )}
                  >
                    {a === "anyone" ? "Anyone with the link" : "Password protected"}
                  </button>
                ))}
              </div>
              {access === "password" && (
                <div className="mt-2 space-y-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-9.5 w-full rounded-xl border border-line bg-canvas px-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Repeat password"
                    className="h-9.5 w-full rounded-xl border border-line bg-canvas px-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
                  />
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Permissions
              </legend>
              <div className="space-y-1.5">
                <Toggle checked={perms.viewPhotos} onChange={(v) => setPerms({ ...perms, viewPhotos: v })} label="View photos" desc={media.some((m) => m.hasImage) ? "Allow viewing photos" : "No photos in this selection"} />
                <Toggle checked={perms.viewVideos} onChange={(v) => setPerms({ ...perms, viewVideos: v })} label="View videos" desc={media.some((m) => m.hasVideo) ? "Allow watching videos" : "No videos in this selection"} />
                <Toggle checked={perms.downloadMedia} onChange={(v) => setPerms({ ...perms, downloadMedia: v })} label="Download media" desc="Allow downloading individual files" />
                <Toggle checked={perms.originalQuality} onChange={(v) => setPerms({ ...perms, originalQuality: v })} label="Original quality" desc="Full-resolution originals" />
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Expiration
              </legend>
              <div className="flex gap-2">
                {(["never", "7", "30"] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setExpiry(e)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-colors",
                      expiry === e ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-2 hover:border-line-strong"
                    )}
                  >
                    {e === "never" ? "Never" : `${e} days`}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => void generate()}>
                Create link
              </Button>
            </div>
          </div>
        )}

        {view === "result" && result && (
          <div className="space-y-4">
            <p className="text-[13px] text-ink-2">
              Anyone with this link can view the{" "}
              {kind === "collection" ? "collection" : kind === "event" ? "event" : "category"} you chose.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={result.url}
                onFocus={(e) => e.target.select()}
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 text-[12px] text-ink-2 focus:outline-none"
              />
              <Button variant="primary" onClick={() => void copy()} className="shrink-0">
                {copied ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <IconButton label={showQR ? "Hide QR code" : "Show QR code"} onClick={() => setShowQR((v) => !v)} active={showQR}>
                <IconQr width={18} height={18} />
              </IconButton>
              <span className="text-[11px] text-ink-3">
                {access === "password" ? "Password protected" : "Anyone with the link"} ·{" "}
                {expiry === "never" ? "Never expires" : `Expires in ${expiry} days`}
              </span>
            </div>

            {showQR && (
              <div className="flex justify-center rounded-2xl border border-line bg-white p-5">
                <QRCodeSVG value={result.url} size={176} />
              </div>
            )}

            {existingLinks.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                  Shared links
                </p>
                <ul className="space-y-1.5">
                  {existingLinks.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
                        {new Date(l.createdAt).toLocaleDateString()} · {l.views} views
                      </span>
                      <IconButton
                        label="Revoke share link"
                        size="sm"
                        onClick={() => {
                          revokeShareLink(l.id);
                          toast("Share link revoked", "neutral");
                        }}
                      >
                        <IconTrash width={15} height={15} className="text-red-500" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}