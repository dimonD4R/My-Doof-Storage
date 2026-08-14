import { useState, type FormEvent, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SITE_PASSWORD, SITE_UNLOCK_KEY } from "../../data/siteConfig";
import { IconEye, IconEyeOff, IconLock, IconSparkles } from "../ui/icons";

/**
 * Gates the private app behind a password. Share routes (`#/share/...`) stay
 * public so shared links keep working; every other route requires the site
 * password. Once unlocked on a device the archive stays accessible there
 * (per-browser localStorage), while visitors opening the site from scratch
 * still see the password screen.
 */
export function SiteGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(SITE_UNLOCK_KEY) === "1"
  );

  const isShareRoute = location.pathname.startsWith("/share");

  if (isShareRoute || unlocked) return <>{children}</>;

  return (
    <SitePasswordGate
      onUnlock={() => {
        try {
          localStorage.setItem(SITE_UNLOCK_KEY, "1");
        } catch {
          /* ignore */
        }
        setUnlocked(true);
      }}
    />
  );
}

function SitePasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value) return;
    if (value === SITE_PASSWORD) onUnlock();
    else setError(true);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 shadow-card"
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconLock width={22} height={22} />
        </span>
        <h1 className="font-display text-[22px] leading-tight text-ink">Your Memories</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          This archive is private. Enter the password to continue.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Password</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              className="h-11 w-full rounded-xl border border-line bg-canvas pr-11 pl-3.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
              placeholder="Enter password"
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:text-ink"
            >
              {show ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
            </button>
          </div>
        </label>
        {error && (
          <p className="mt-2 text-[12.5px] text-red-600 dark:text-red-400">
            That password isn't correct. Try again.
          </p>
        )}
        <button
          type="submit"
          disabled={!value}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-accent text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Unlock
        </button>
      </form>
      <p className="mt-6 flex items-center gap-1.5 text-[12px] text-ink-3">
        <IconSparkles width={13} height={13} /> Your Memories — private archive
      </p>
    </div>
  );
}