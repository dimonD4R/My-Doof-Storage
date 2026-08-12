import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Collection, MediaItem } from "../types";
import { useApp } from "../state/AppStore";
import { thumbUrl } from "../data/mediaUrlResolver";
import { plural } from "../utils/date";
import { CollectionFormDialog } from "../components/collections/CollectionFormDialog";
import { ShareModal } from "../components/sharing/ShareModal";
import { DownloadDialog } from "../components/downloads/DownloadDialog";
import { Button, EmptyState } from "../components/ui";
import { IconDownload, IconFolder, IconFilm, IconPlus, IconShare, IconTrash } from "../components/ui/icons";

export function CollectionsPage() {
  const { archive, collections, deleteCollection, toast } = useApp();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [shareFor, setShareFor] = useState<Collection | null>(null);
  const [dlFor, setDlFor] = useState<Collection | null>(null);

  const items = useMemo(() => {
    const out: {
      collection: Collection;
      coverPath: string | null;
      media: MediaItem[];
      photos: number;
      videos: number;
    }[] = [];
    for (const c of collections) {
      const media = c.mediaIds
        .map((id) => archive?.byId.get(id))
        .filter((m): m is MediaItem => !!m);
      const cover =
        (c.coverMediaId && archive?.byId.get(c.coverMediaId)?.imagePath) ||
        media.find((m) => m.hasImage)?.imagePath ||
        null;
      out.push({
        collection: c,
        coverPath: cover,
        media,
        photos: media.filter((m) => m.hasImage).length,
        videos: media.filter((m) => m.hasVideo).length,
      });
    }
    return out;
  }, [collections, archive]);

  if (!archive) return null;

  const remove = (c: Collection) => {
    if (window.confirm(`Delete collection “${c.name}”? The memories themselves are not removed.`)) {
      deleteCollection(c.id);
      toast(`Deleted “${c.name}”`, "neutral");
    }
  };

  return (
    <div className="anim-rise">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Collections</h1>
          <p className="text-[13px] text-ink-2">
            Curated selections that mix memories across events, years, and categories.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
          <IconPlus width={15} height={15} /> Create collection
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconFolder width={30} height={30} />}
          title="No collections yet"
          message="Group your favorite moments across different events and years."
          action={
            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
              <IconPlus width={15} height={15} /> Create collection
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ collection: c, coverPath, media, photos, videos }) => (
            <div
              key={c.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-line-strong hover:shadow-card"
            >
              <Link to={`/collections/${c.id}`} className="relative block aspect-[4/3] media-tile">
                {coverPath ? (
                  <img src={thumbUrl(archive.repository, coverPath)} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                ) : videos > 0 ? (
                  <span className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
                    <IconFilm width={30} height={30} />
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
                    <IconFolder width={30} height={30} />
                  </span>
                )}
                <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-[2px]">
                  {plural(media.length, "memory")}
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-3.5">
                <Link to={`/collections/${c.id}`} className="clamp-1 text-[14.5px] font-semibold text-ink group-hover:text-accent">
                  {c.name}
                </Link>
                {c.description && (
                  <p className="clamp-2 mt-0.5 text-[12px] leading-relaxed text-ink-3">{c.description}</p>
                )}
                <p className="mt-1.5 text-[11.5px] text-ink-3">
                  {plural(photos, "photo")} · {plural(videos, "video")}
                </p>

                <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
                  <Link
                    to={`/collections/${c.id}`}
                    className="flex-1 text-center text-[12.5px] font-medium text-accent hover:underline"
                  >
                    Open
                  </Link>
                  <span className="h-4 w-px bg-line" aria-hidden="true" />
                  <button
                    aria-label={`Share ${c.name}`}
                    title="Share"
                    onClick={() => setShareFor(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-card-2 hover:text-ink"
                  >
                    <IconShare width={15} height={15} />
                  </button>
                  <button
                    aria-label={`Download ${c.name}`}
                    title="Download"
                    disabled={media.length === 0}
                    onClick={() => setDlFor(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-card-2 hover:text-ink disabled:opacity-30"
                  >
                    <IconDownload width={15} height={15} />
                  </button>
                  <button
                    aria-label={`Delete ${c.name}`}
                    title="Delete"
                    onClick={() => remove(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <CollectionFormDialog
          onClose={() => setFormOpen(false)}
          onSaved={(c) => {
            setFormOpen(false);
            navigate(`/collections/${c.id}`);
          }}
        />
      )}

      {shareFor && (
        <ShareModal
          kind="collection"
          targetId={shareFor.id}
          name={shareFor.name}
          about={shareFor.description || "A collection of shared memories"}
          media={items.find((i) => i.collection.id === shareFor.id)?.media ?? []}
          onClose={() => setShareFor(null)}
        />
      )}

      {dlFor && (
        <DownloadDialog
          targets={(items.find((i) => i.collection.id === dlFor.id)?.media ?? []).map((m, i) => ({
            media: m,
            which: m.hasImage ? "image" : "video",
            sortIndex: i,
          }))}
          zipName={dlFor.name}
          groupDir={dlFor.name}
          onClose={() => setDlFor(null)}
        />
      )}
    </div>
  );
}