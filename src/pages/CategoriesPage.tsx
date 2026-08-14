import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { MemoryEvent } from "../types";
import { EMPTY_FILTERS } from "../types";
import { useApp } from "../state/AppStore";
import { applyFilters } from "../lib/filtering";
import { plural } from "../utils/date";
import { EventCover } from "../components/events/EventCover";
import { MediaGrid } from "../components/gallery/MediaGrid";
import { ShareModal } from "../components/sharing/ShareModal";
import { EmptyState, Button } from "../components/ui";
import { IconChevronLeft, IconShare, IconTags } from "../components/ui/icons";

export function CategoriesPage() {
  const { archive, prefs, openLightbox } = useApp();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const selectedCategory = params.get("category") ?? "";
  const [shareFor, setShareFor] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!archive) return [];
    const filters = { ...EMPTY_FILTERS, search };
    return archive.categories
      .map((c) => {
        const allMedia = archive.media.filter((m) => m.category === c.name);
        const media = search.trim()
          ? applyFilters(allMedia, filters, { favorites: new Set(), collections: [] })
          : allMedia;
        const photos = media.filter((m) => m.hasImage).length;
        const videos = media.filter((m) => m.hasVideo).length;
        const pseudo: MemoryEvent = {
          id: `cat-${c.name}`,
          title: c.name,
          category: c.name,
          subcategories: Array.from(new Set(media.flatMap((m) => m.subcategories))).slice(0, 8),
          keywords: [],
          people: Array.from(new Set(media.flatMap((m) => m.people))).slice(0, 4),
          dateISO: "",
          date: null,
          precision: "year",
          coverMediaId: null,
          mediaIds: media.map((m) => m.id),
          photoCount: photos,
          videoCount: videos,
        };
        return { category: c, pseudo, photos, videos, count: media.length };
      })
      .filter((c) => !search.trim() || c.count > 0);
  }, [archive, search]);

  const selectedMedia = useMemo(() => {
    if (!archive || !selectedCategory) return [];
    const all = archive.media.filter((m) => m.category === selectedCategory);
    if (!search.trim()) return all;
    return applyFilters(all, { ...EMPTY_FILTERS, search }, { favorites: new Set(), collections: [] });
  }, [archive, selectedCategory, search]);

  const shareMedia = useMemo(() => {
    if (!archive || !shareFor) return [];
    return archive.media.filter((m) => m.category === shareFor);
  }, [archive, shareFor]);

  const goBack = () => {
    const next = new URLSearchParams(params);
    next.delete("category");
    setParams(next, { replace: true });
  };

  const setCategory = (name: string) => {
    const next = new URLSearchParams(params);
    next.set("category", name);
    setParams(next, { replace: true });
  };

  if (!archive) return null;

  // ---- Selected category detail (stays on the Categories page) ----
  if (selectedCategory) {
    return (
      <div className="anim-rise">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <IconChevronLeft width={15} height={15} /> Categories
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">{selectedCategory}</h1>
            <p className="text-[13px] text-ink-2">
              {plural(selectedMedia.length, "memory")}
              {search.trim() ? ` found for “${search.trim()}”` : ""}
            </p>
          </div>
          {selectedMedia.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShareFor(selectedCategory)}>
              <IconShare width={15} height={15} /> Share
            </Button>
          )}
        </div>

        {selectedMedia.length === 0 ? (
          <EmptyState
            icon={<IconTags width={30} height={30} />}
            title="No memories found"
            message={`Nothing in ${selectedCategory} matches “${search.trim()}”.`}
          />
        ) : (
          <MediaGrid
            items={selectedMedia}
            view={prefs.galleryView}
            selectionMode={false}
            selectedIds={new Set()}
            onToggleSelect={() => {}}
            onOpen={(index) => openLightbox(selectedMedia, index)}
          />
        )}

        {shareFor && (
          <ShareModal
            kind="category"
            targetId={selectedCategory}
            name={selectedCategory}
            about={plural(selectedMedia.length, "memory")}
            media={selectedMedia}
            onClose={() => setShareFor(null)}
          />
        )}
      </div>
    );
  }

  // ---- Category grid ----
  return (
    <div className="anim-rise">
      <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Categories</h1>
      <p className="mb-6 text-[13px] text-ink-2">
        {search.trim()
          ? plural(categories.reduce((n, c) => n + c.count, 0), "memory") + ` found in ${plural(categories.length, "category")} for “${search.trim()}”.`
          : `${plural(archive.categories.length, "category")} generated from your archive — new ones appear automatically.`}
      </p>

      {categories.length === 0 ? (
        <EmptyState
          icon={<IconTags width={30} height={30} />}
          title="No categories match"
          message={search.trim() ? `Nothing found for “${search.trim()}”. Try another search.` : "Categories appear here as memories are added."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ category, pseudo, photos, videos, count }) => (
            <div
              key={category.name}
              className="group relative block overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-line-strong hover:shadow-card"
            >
              <button
                onClick={() => setCategory(category.name)}
                className="block w-full text-left"
              >
                <EventCover event={pseudo} rounded="rounded-none" className="aspect-[4/3]" />
                <div className="p-3.5">
                  <h3 className="clamp-1 text-[14.5px] font-semibold text-ink group-hover:text-accent">
                    {category.name}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {plural(count, "memory")}
                    {photos > 0 && ` · ${plural(photos, "photo")}`}
                    {videos > 0 && ` · ${plural(videos, "video")}`}
                  </p>
                  {pseudo.people.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pseudo.people.map((p) => (
                        <span key={p} className="rounded-full bg-card-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
              {count > 0 && (
                <button
                  aria-label={`Share ${category.name}`}
                  title="Share this category"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareFor(category.name);
                  }}
                  className="absolute right-2.5 top-2.5 z-10 rounded-full bg-black/45 p-2 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/65 focus:opacity-100 group-hover:opacity-100"
                >
                  <IconShare width={15} height={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {shareFor && (
        <ShareModal
          kind="category"
          targetId={shareFor}
          name={shareFor}
          about={plural(shareMedia.length, "memory")}
          media={shareMedia}
          onClose={() => setShareFor(null)}
        />
      )}
    </div>
  );
}
