import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { MediaItem } from "../types";
import { useApp } from "../state/AppStore";
import { thumbUrl } from "../data/mediaUrlResolver";
import { plural } from "../utils/date";
import { sortMedia } from "../lib/filtering";
import { CollectionFormDialog } from "../components/collections/CollectionFormDialog";
import { MediaGrid } from "../components/gallery/MediaGrid";
import { ShareModal } from "../components/sharing/ShareModal";
import { DownloadDialog } from "../components/downloads/DownloadDialog";
import { Button, Chip, EmptyState, Overlay } from "../components/ui";
import {
  IconArrowLeft,
  IconCheck,
  IconDownload,
  IconFolder,
  IconPhoto,
  IconPlus,
  IconShare,
  IconTrash,
  IconX,
} from "../components/ui/icons";

export function CollectionDetailPage() {
  const { id } = useParams();
  const {
    archive,
    collections,
    updateCollection,
    addToCollection,
    removeFromCollection,
    deleteCollection,
    openLightbox,
    toast,
  } = useApp();

  const collection = collections.find((c) => c.id === id) ?? null;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);

  const media = useMemo<MediaItem[]>(() => {
    if (!archive || !collection) return [];
    const items = collection.mediaIds.map((mid) => archive.byId.get(mid)).filter((m): m is MediaItem => !!m);
    return sortMedia(items, "oldest");
  }, [archive, collection]);

  const photos = media.filter((m) => m.hasImage).length;
  const videos = media.filter((m) => m.hasVideo).length;

  const coverPath = useMemo(() => {
    if (!collection || !archive) return null;
    return (
      (collection.coverMediaId && archive.byId.get(collection.coverMediaId)?.imagePath) ||
      media.find((m) => m.hasImage)?.imagePath ||
      null
    );
  }, [collection, archive, media]);

  if (!archive) return null;

  if (!collection) {
    return (
      <EmptyState
        icon={<IconFolder width={30} height={30} />}
        title="Collection not found"
        message="This collection may have been deleted."
        action={
          <Link to="/collections" className="text-[13px] font-medium text-accent">
            ← Back to collections
          </Link>
        }
      />
    );
  }

  const selectedItems = media.filter((m) => selectedIds.has(m.id));
  const toggleSelect = (mid: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mid)) next.delete(mid);
      else next.add(mid);
      return next;
    });

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const removeSelected = () => {
    if (selectedItems.length === 0) return;
    removeFromCollection(collection.id, selectedItems.map((m) => m.id));
    toast(`Removed ${plural(selectedItems.length, "memory")}`, "neutral");
    exitSelection();
  };

  const deleteCollectionNow = () => {
    if (window.confirm(`Delete collection “${collection.name}”? The memories themselves are not removed.`)) {
      deleteCollection(collection.id);
      toast(`Deleted “${collection.name}”`, "neutral");
    }
  };

  const handleOpen = (index: number) => openLightbox(media, index);

  return (
    <div className="anim-rise">
      <Link to="/collections" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink">
        <IconArrowLeft width={15} height={15} /> All collections
      </Link>

      {/* Header */}
      <div className="mb-8 grid gap-6 md:grid-cols-[340px_1fr]">
        <button
          onClick={() => setCoverOpen(true)}
          className="media-tile aspect-[4/3] overflow-hidden rounded-2xl border border-line md:aspect-auto md:min-h-[280px]"
          aria-label="Choose collection cover"
          title="Change cover image"
        >
          {coverPath ? (
            <img src={thumbUrl(archive.repository, coverPath)} alt={collection.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
              <IconFolder width={38} height={38} />
            </span>
          )}
          {media.length > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
              Change cover
            </span>
          )}
        </button>

        <div className="flex flex-col justify-center">
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-3">Collection</p>
          <h1 className="mt-1 font-display text-[30px] leading-tight text-ink sm:text-[38px]">{collection.name}</h1>
          {collection.description && (
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-ink-2">{collection.description}</p>
          )}
          <p className="mt-2 text-[13px] text-ink-2">
            {plural(media.length, "memory")} · {plural(photos, "photo")} · {plural(videos, "video")}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
              <IconPlus width={15} height={15} /> Add memories
            </Button>
            <Button variant="secondary" size="md" onClick={() => setShareOpen(true)} disabled={media.length === 0}>
              <IconShare width={15} height={15} /> Share
            </Button>
            <Button variant="secondary" size="md" onClick={() => setDlOpen(true)} disabled={media.length === 0}>
              <IconDownload width={15} height={15} /> Download
            </Button>
            <Button variant="ghost" size="md" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={deleteCollectionNow}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <IconTrash width={15} height={15} /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Selection bar */}
      {selectionMode && (
        <div className="sticky top-14 z-20 -mx-3 mb-4 border-y border-line bg-canvas/95 px-3 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-ink">{selectedItems.length} selected</span>
            <Button variant="ghost" size="xs" onClick={() => setSelectedIds(new Set(media.map((m) => m.id)))}>
              <IconCheck width={13} height={13} /> Select all
            </Button>
            <div className="ml-auto flex gap-1.5">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setDlOpen(true)}
                disabled={selectedItems.length === 0}
              >
                <IconDownload width={13} height={13} /> Download
              </Button>
              <Button size="xs" variant="secondary" onClick={removeSelected} disabled={selectedItems.length === 0}>
                <IconTrash width={13} height={13} /> Remove
              </Button>
              <Button variant="ghost" size="xs" onClick={exitSelection}>
                <IconX width={15} height={15} /> Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {media.length === 0 ? (
        <EmptyState
          icon={<IconPhoto width={30} height={30} />}
          title="This collection is empty"
          message="Start adding memories from any event, year, or category."
          action={
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <IconPlus width={15} height={15} /> Add memories
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {!selectionMode && (
            <div className="flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSelectionMode(true)}>
                Select
              </Button>
            </div>
          )}
          <MediaGrid
            items={media}
            view="grid"
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onOpen={handleOpen}
          />
        </div>
      )}

      {/* Dialogs */}
      {addOpen && (
        <AddMemoriesDialog
          existing={new Set(media.map((m) => m.id))}
          onAdd={(ids) => {
            addToCollection(collection.id, ids);
            toast(`Added ${plural(ids.length, "memory")} to “${collection.name}”`, "success");
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {coverOpen && (
        <CoverPicker
          items={media}
          current={collection.coverMediaId}
          onPick={(coverMediaId) => {
            updateCollection(collection.id, { coverMediaId });
            toast("Cover updated", "success");
            setCoverOpen(false);
          }}
          onClose={() => setCoverOpen(false)}
        />
      )}

      {editOpen && (
        <CollectionFormDialog
          editing={collection}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}

      {shareOpen && (
        <ShareModal
          kind="collection"
          targetId={collection.id}
          name={collection.name}
          about={collection.description || "A collection of shared memories"}
          media={media}
          onClose={() => setShareOpen(false)}
        />
      )}

      {dlOpen && (
        <DownloadDialog
          targets={media.map((m, i) => ({ media: m, which: m.hasImage ? "image" : "video", sortIndex: i }))}
          zipName={collection.name}
          groupDir={collection.name}
          onClose={() => setDlOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add-memories picker
// ---------------------------------------------------------------------------

function AddMemoriesDialog({
  existing,
  onAdd,
  onClose,
}: {
  existing: Set<string>;
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}) {
  const { archive } = useApp();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pool = useMemo(() => {
    if (!archive) return [];
    const q = query.trim().toLowerCase();
    return archive.media
      .filter((m) => !existing.has(m.id))
      .filter((m) => {
        if (!q) return true;
        return (
          m.category.toLowerCase().includes(q) ||
          m.fileName.toLowerCase().includes(q) ||
          m.subcategories.some((s) => s.toLowerCase().includes(q)) ||
          m.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  }, [archive, existing, query]);

  if (!archive) return null;

  const toggle = (mid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mid)) next.delete(mid);
      else next.add(mid);
      return next;
    });

  return (
    <Overlay open onClose={onClose} title="Add memories" ariaLabel="Add memories to collection" side="bottom" panelClassName="sm:mx-auto sm:mb-4 sm:w-[720px] sm:max-w-[calc(100vw-24px)] sm:rounded-2xl sm:border sm:shadow-float" footer={
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-ink-2">
          {selected.size} selected · {pool.length} available{query.trim() ? " (filtered)" : ""}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={selected.size === 0} onClick={() => onAdd(Array.from(selected))}>
            <IconPlus width={14} height={14} /> Add {selected.size > 0 ? selected.size : ""}
          </Button>
        </div>
      </div>
    }>
      <div className="flex flex-col gap-3 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by category, file name, or keyword…"
          aria-label="Filter memories"
          className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-[13.5px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip selected={selected.size === pool.length && pool.length > 0} onClick={() => setSelected(new Set(pool.map((m) => m.id)))}>
            Select all
          </Chip>
          {selected.size > 0 && (
            <Chip onClick={() => setSelected(new Set())}>Clear</Chip>
          )}
        </div>
        <div className="max-h-[46dvh] overflow-y-auto">
          {pool.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12.5px] text-ink-3">
              {existing.size === archive.media.length ? "Everything is already in this collection." : "No matching memories."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {pool.map((m) => (
                <PickTile key={m.id} path={m.imagePath || m.videoPath} selected={selected.has(m.id)} onToggle={() => toggle(m.id)} label={m.category} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

function PickTile({
  path,
  selected,
  onToggle,
  label,
}: {
  path: string;
  selected: boolean;
  onToggle: () => void;
  label: string;
}) {
  const { archive } = useApp();
  if (!archive) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="media-tile aspect-square w-full overflow-hidden rounded-lg border"
    >
      <img src={thumbUrl(archive.repository, path)} alt={label} loading="lazy" className="h-full w-full object-cover" />
      <span
        className={
          "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border transition-colors " +
          (selected ? "border-accent bg-accent text-accent-ink" : "border-white/70 bg-black/30 text-transparent")
        }
      >
        {selected && <IconCheck width={11} height={11} />}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cover picker
// ---------------------------------------------------------------------------

function CoverPicker({
  items,
  current,
  onPick,
  onClose,
}: {
  items: MediaItem[];
  current: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { archive } = useApp();
  const images = items.filter((m) => m.hasImage);
  if (!archive) return null;

  return (
    <Overlay open onClose={onClose} title="Choose a cover" ariaLabel="Choose collection cover">
      <div className="p-4">
        {images.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12.5px] text-ink-3">
            This collection has no photos yet. Add photos to pick a cover.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((m) => (
              <button
                key={m.id}
                onClick={() => onPick(m.id)}
                className={
                  "media-tile aspect-[4/3] w-full overflow-hidden rounded-lg border " +
                  (current === m.id ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-canvas" : "border-line")
                }
                aria-label={`Set cover to ${m.title}`}
              >
                <img src={thumbUrl(archive.repository, m.imagePath)} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
                {current === m.id && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
                    <IconCheck width={11} height={11} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  );
}