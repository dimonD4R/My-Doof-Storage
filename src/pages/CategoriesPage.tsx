import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { MemoryEvent } from "../types";
import { useApp } from "../state/AppStore";
import { plural } from "../utils/date";
import { EventCover } from "../components/events/EventCover";
import { EmptyState } from "../components/ui";
import { IconTags } from "../components/ui/icons";

export function CategoriesPage() {
  const { archive } = useApp();

  const categories = useMemo(() => {
    if (!archive) return [];
    return archive.categories.map((c) => {
      const media = archive.media.filter((m) => m.category === c.name);
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
      return { category: c, pseudo, photos, videos };
    });
  }, [archive]);

  if (!archive) return null;

  return (
    <div className="anim-rise">
      <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Categories</h1>
      <p className="mb-6 text-[13px] text-ink-2">
        {plural(archive.categories.length, "category")} generated from your archive — new ones appear automatically.
      </p>

      {categories.length === 0 ? (
        <EmptyState
          icon={<IconTags width={30} height={30} />}
          title="No categories yet"
          message="Categories appear here as memories are added."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ category, pseudo, photos, videos }) => (
            <Link
              key={category.name}
              to={`/memories?category=${encodeURIComponent(category.name)}`}
              className="group block overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-line-strong hover:shadow-card"
            >
              <EventCover event={pseudo} rounded="rounded-none" className="aspect-[4/3]" />
              <div className="p-3.5">
                <h3 className="clamp-1 text-[14.5px] font-semibold text-ink group-hover:text-accent">
                  {category.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {plural(category.count, "memory")}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}