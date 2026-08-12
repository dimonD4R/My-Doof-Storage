import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppStore";
import { thumbUrl } from "../data/mediaUrlResolver";
import { plural } from "../utils/date";
import { EmptyState } from "../components/ui";
import { IconUsers } from "../components/ui/icons";

export function PeoplePage() {
  const { archive } = useApp();

  const people = useMemo(() => {
    if (!archive) return [];
    return archive.people.map((p) => {
      const media = archive.media.filter((m) => m.people.includes(p.name));
      const cover = media.find((m) => m.hasImage) ?? media[0];
      const categories = Array.from(new Set(media.map((m) => m.category))).slice(0, 3);
      const photos = media.filter((m) => m.hasImage).length;
      const videos = media.filter((m) => m.hasVideo).length;
      return { person: p, media, cover, categories, photos, videos };
    });
  }, [archive]);

  if (!archive) return null;

  return (
    <div className="anim-rise">
      <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">People</h1>
      <p className="mb-6 text-[13px] text-ink-2">
        Names detected from keywords and subcategories. Derived metadata only — no facial recognition.
      </p>

      {people.length === 0 ? (
        <EmptyState
          icon={<IconUsers width={30} height={30} />}
          title="No people detected"
          message="People appear here when names show up in your keywords or subcategories."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {people.map(({ person, cover, categories, photos, videos }) => (
            <Link
              key={person.name}
              to={`/memories?person=${encodeURIComponent(person.name)}`}
              className="group block overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-line-strong hover:shadow-card"
            >
              <div className="media-tile aspect-square w-full">
                {cover?.hasImage ? (
                  <img src={thumbUrl(archive.repository, cover.imagePath)} alt={cover.title} loading="lazy" className="h-full w-full object-cover" />
                ) : cover?.hasVideo ? (
                  <div className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
                    <span className="font-display text-[20px]">{person.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card-2 text-ink-3">
                    <IconUsers width={26} height={26} />
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <h3 className="text-[14.5px] font-semibold text-ink group-hover:text-accent">{person.name}</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {plural(person.count, "memory")}
                  {photos > 0 && ` · ${plural(photos, "photo")}`}
                  {videos > 0 && ` · ${plural(videos, "video")}`}
                </p>
                {categories.length > 0 && (
                  <p className="mt-1.5 truncate text-[11px] text-ink-3">{categories.join(" · ")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}