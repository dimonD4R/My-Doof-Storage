import { useMemo, useState } from "react";
import type { MediaItem } from "../types";
import { useApp } from "../state/AppStore";
import { sortMedia } from "../lib/filtering";
import { MediaGrid } from "../components/gallery/MediaGrid";
import { AddToCollectionDialog } from "../components/collections/AddToCollectionDialog";
import { ShareModal } from "../components/sharing/ShareModal";
import { DownloadDialog } from "../components/downloads/DownloadDialog";
import { Button, EmptyState } from "../components/ui";
import { IconCheck, IconDownload, IconHeart, IconShare, IconTrash, IconX } from "../components/ui/icons";
import { plural } from "../utils/date";

export function FavoritesPage() {
  const { archive, favorites, toggleFavorite, clearFavorites, openLightbox, toast } = useApp();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);

  const items = useMemo<MediaItem[]>(() => {
    if (!archive) return [];
    const fav = favorites;
    const list = archive.media.filter((m) => fav.has(m.id));
    return sortMedia(list, "newest");
  }, [archive, favorites]);

  const selectedItems = items.filter((m) => selectedIds.has(m.id));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const unfavoriteSelected = () => {
    selectedItems.forEach((m) => toggleFavorite(m.id));
    toast(`Removed ${plural(selectedItems.length, "favorite")}`, "neutral");
    exitSelection();
  };

  const selectAll = () => setSelectedIds(new Set(items.map((m) => m.id)));

  if (!archive) return null;

  return (
    <div className="anim-rise">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Favorites</h1>
          <p className="text-[13px] text-ink-2">
            {plural(items.length, "saved memory")} — the moments worth revisiting.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {selectionMode ? (
            <Button variant="ghost" size="sm" onClick={exitSelection}>
              <IconX width={15} height={15} /> Cancel
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setSelectionMode(true)}>
              Select
            </Button>
          )}
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Clear all favorites? Memories themselves are not removed.")) {
                  clearFavorites();
                  toast("Favorites cleared", "neutral");
                }
              }}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <IconTrash width={15} height={15} /> Clear all
            </Button>
          )}
        </div>
      </div>

      {selectionMode && (
        <div className="sticky top-14 z-20 -mx-3 mb-4 border-y border-line bg-canvas/95 px-3 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-ink">{selectedItems.length} selected</span>
            <Button variant="ghost" size="xs" onClick={selectAll}>
              <IconCheck width={13} height={13} /> Select all
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" onClick={() => setPickerOpen(true)} disabled={!selectedItems.length}>
                Add to collection
              </Button>
              <Button size="xs" variant="secondary" onClick={() => setDlOpen(true)} disabled={!selectedItems.length}>
                <IconDownload width={13} height={13} /> Download
              </Button>
              <Button size="xs" variant="secondary" onClick={() => setShareOpen(true)} disabled={!selectedItems.length}>
                <IconShare width={13} height={13} /> Share
              </Button>
              <Button size="xs" variant="secondary" onClick={unfavoriteSelected} disabled={!selectedItems.length}>
                <IconTrash width={13} height={13} /> Unfavorite
              </Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<IconHeart width={30} height={30} />}
          title="No favorites yet"
          message="Tap the heart on any memory to keep it here."
        />
      ) : (
        <MediaGrid
          items={items}
          view="grid"
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onOpen={(i) => openLightbox(items, i)}
        />
      )}

      {pickerOpen && (
        <AddToCollectionDialog
          mediaList={selectedItems}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {shareOpen && selectedItems.length > 0 && (
        <ShareModal
          kind="collection"
          targetId="favorites"
          name={`${selectedItems.length} favorite memories`}
          about={"A selection of favorite memories shared from the archive"}
          media={selectedItems}
          onClose={() => setShareOpen(false)}
        />
      )}

      {dlOpen && (
        <DownloadDialog
          targets={selectedItems.map((m, i) => ({ media: m, which: m.hasImage ? "image" : "video", sortIndex: i }))}
          zipName="favorites"
          groupDir="Favorites"
          onClose={() => setDlOpen(false)}
        />
      )}
    </div>
  );
}