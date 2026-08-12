import { useMemo, useState } from "react";
import type { MediaItem, SortKey } from "../types";
import { useApp } from "../state/AppStore";
import { useArchiveFilters } from "../hooks/useFilters";
import { sortMedia } from "../lib/filtering";
import { MediaGrid } from "../components/gallery/MediaGrid";
import { FilterDrawer } from "../components/filters/FilterDrawer";
import { ActiveFilters } from "../components/filters/ActiveFilters";
import { AddToCollectionDialog } from "../components/collections/AddToCollectionDialog";
import { ShareModal } from "../components/sharing/ShareModal";
import { DownloadDialog } from "../components/downloads/DownloadDialog";
import { Button, EmptyState } from "../components/ui";
import {
  IconCheck,
  IconDownload,
  IconGrid,
  IconLayoutGrid,
  IconLayoutMasonry,
  IconLayoutTimeline,
  IconPhoto,
  IconShare,
  IconSliders,
  IconX,
} from "../components/ui/icons";
import { cn } from "../utils/cn";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "oldest", label: "Oldest first" },
  { key: "newest", label: "Newest first" },
  { key: "recentlyAdded", label: "Recently added" },
  { key: "nameAsc", label: "Name A–Z" },
  { key: "nameDesc", label: "Name Z–A" },
  { key: "category", label: "Category" },
];

export function MemoriesPage() {
  const { archive, prefs, setView, setSort, openLightbox, addFavorites, toast } = useApp();
  const { filters, patch, reset, results, activeCount, isActive } = useArchiveFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);

  const view = prefs.galleryView;
  const sorted = useMemo(() => sortMedia(results, prefs.sortKey), [results, prefs.sortKey]);
  const total = archive?.media.length ?? 0;

  const selectedItems = useMemo(
    () => sorted.filter((m) => selectedIds.has(m.id)),
    [sorted, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleOpen = (index: number) => {
    openLightbox(sorted, index);
  };

  const [addPickerFor, setAddPickerFor] = useState<MediaItem | null>(null);

  const selectAll = () => setSelectedIds(new Set(sorted.map((m) => m.id)));

  const favoriteSelected = () => {
    addFavorites(selectedItems.map((m) => m.id));
    toast(`Added ${selectedItems.length} to favorites`, "success");
  };

  const shareSelected = () => {
    if (selectedItems.length === 0) return;
    setShareOpen(true);
  };

  return (
    <div className="anim-rise">
      {/* Heading */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Memories</h1>
          <p className="text-[13px] text-ink-2">
            Showing <span className="font-semibold tabular-nums text-ink">{results.length}</span> of{" "}
            <span className="tabular-nums">{total}</span> memories
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="relative"
            aria-label="Open filters"
          >
            <IconSliders width={15} height={15} /> Filters
            {activeCount > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-ink tabular-nums">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Toolbar row 2: view switcher + sort */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ActiveFilters filters={filters} onPatch={patch} onReset={reset} />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-line bg-card p-0.5">
            <ViewButton active={view === "grid"} label="Grid" onClick={() => setView("grid")}>
              <IconLayoutGrid width={16} height={16} />
            </ViewButton>
            <ViewButton active={view === "comfortable"} label="Comfortable" onClick={() => setView("comfortable")}>
              <IconGrid width={16} height={16} />
            </ViewButton>
            <ViewButton active={view === "masonry"} label="Masonry" onClick={() => setView("masonry")}>
              <IconLayoutMasonry width={16} height={16} />
            </ViewButton>
            <ViewButton active={view === "timeline"} label="Timeline" onClick={() => setView("timeline")}>
              <IconLayoutTimeline width={16} height={16} />
            </ViewButton>
          </div>

          <label className="relative">
            <span className="sr-only">Sort memories</span>
            <select
              value={prefs.sortKey}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-full border border-line bg-card px-3 pr-8 text-[12.5px] font-medium text-ink-2 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Selection bar */}
      {selectionMode && (
        <div className="sticky top-14 z-20 -mx-3 mb-4 border-y border-line bg-canvas/95 px-3 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-ink">
              {selectedItems.length} selected
            </span>
            <Button variant="ghost" size="xs" onClick={selectAll}>
              <IconCheck width={13} height={13} /> Select all
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" onClick={() => setPickerOpen(true)} disabled={!selectedItems.length}>
                Add to collection
              </Button>
              <Button size="xs" variant="secondary" onClick={favoriteSelected} disabled={!selectedItems.length}>
                Favorite
              </Button>
              <Button size="xs" variant="secondary" onClick={() => setDlOpen(true)} disabled={!selectedItems.length}>
                <IconDownload width={13} height={13} /> Download
              </Button>
              <Button size="xs" variant="secondary" onClick={shareSelected} disabled={!selectedItems.length}>
                <IconShare width={13} height={13} /> Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid / states */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<IconPhoto width={30} height={30} />}
          title="No memories found"
          message={isActive ? "Try adjusting your filters or search terms." : "This archive is empty."}
          action={
            isActive ? (
              <Button variant="primary" size="sm" onClick={reset}>Clear filters</Button>
            ) : undefined
          }
        />
      ) : (
        <MediaGrid
          items={sorted}
          view={view}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onOpen={handleOpen}
          onAddToCollection={
            selectionMode ? undefined : (m) => setAddPickerFor(m)
          }
        />
      )}

      {/* Dialogs */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        archive={archive}
        filters={filters}
        onPatch={patch}
        onReset={reset}
        resultCount={results.length}
        totalCount={total}
      />

      {(pickerOpen || addPickerFor) && (
        <AddToCollectionDialog
          mediaList={selectedItems.length ? selectedItems : addPickerFor ? [addPickerFor] : []}
          onClose={() => {
            setPickerOpen(false);
            setAddPickerFor(null);
          }}
        />
      )}

      {shareOpen && selectedItems.length > 0 && (
        <ShareModal
          kind="collection"
          targetId="selection"
          name={`${selectedItems.length} selected memories`}
          about={"A selection of memories shared from the archive"}
          media={selectedItems}
          onClose={() => setShareOpen(false)}
        />
      )}

      {dlOpen && (
        <DownloadDialog
          targets={selectedItems.map((m, i) => ({ media: m, which: m.hasImage ? "image" : "video", sortIndex: i }))}
          zipName={`selected-memories`}
          groupDir={null}
          onClose={() => setDlOpen(false)}
        />
      )}
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        active ? "bg-accent text-accent-ink" : "text-ink-3 hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}