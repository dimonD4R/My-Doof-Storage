import { useState } from "react";
import type { MediaItem } from "../../types";
import { useApp } from "../../state/AppStore";
import { Button, Overlay } from "../ui";
import { IconFolder, IconPlus } from "../ui/icons";

export function AddToCollectionDialog({
  mediaList,
  onClose,
}: {
  mediaList: MediaItem[];
  onClose: () => void;
}) {
  const { collections, addToCollection, createCollection, toast } = useApp();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const ids = mediaList.map((m) => m.id);
  const count = ids.length;

  return (
    <Overlay
      open
      onClose={onClose}
      title={`Add ${count} ${count === 1 ? "memory" : "memories"} to…`}
      ariaLabel="Add to collection"
    >
      <div className="p-4">
        {collections.length > 0 && (
          <ul className="mb-4 space-y-1">
            {collections.map((c) => {
              const already = c.mediaIds.filter((x) => ids.includes(x)).length;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      addToCollection(c.id, ids);
                      toast(
                        already > 0
                          ? `${count} added · ${already} already in “${c.name}”`
                          : `Added ${count} ${count === 1 ? "memory" : "memories"} to “${c.name}”`,
                        "success"
                      );
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 text-left transition-colors hover:border-line-strong hover:bg-card-2"
                  >
                    <span className="text-ink-3"><IconFolder width={18} height={18} /></span>
                    <span className="flex-1">
                      <span className="block text-[13.5px] font-medium text-ink">{c.name}</span>
                      {c.description && (
                        <span className="block truncate text-[12px] text-ink-3">{c.description}</span>
                      )}
                    </span>
                    {already > 0 && (
                      <span className="rounded-full bg-card-2 px-2 py-0.5 text-[11px] text-ink-3">
                        {already} already added
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {creating ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              const coll = createCollection({ name, description: "", coverMediaId: ids[0] ?? null, mediaIds: ids });
              toast(`Created “${coll.name}” with ${count} ${count === 1 ? "memory" : "memories"}`, "success");
              onClose();
            }}
            className="space-y-3"
          >
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">Collection name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer 2026"
                className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
                Create &amp; add
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            <IconPlus width={16} height={16} />
            Create new collection
          </button>
        )}
      </div>
    </Overlay>
  );
}