import { useState, type FormEvent } from "react";
import type { Collection } from "../../types";
import { useApp } from "../../state/AppStore";
import { Button, Overlay } from "../ui";
import { IconFolder } from "../ui/icons";

interface Props {
  /** When provided, edits the existing collection instead of creating one. */
  editing?: Collection | null;
  onClose: () => void;
  onSaved: (collection: Collection) => void;
}

export function CollectionFormDialog({ editing, onClose, onSaved }: Props) {
  const { createCollection, updateCollection, toast } = useApp();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      updateCollection(editing.id, { name: name.trim(), description: description.trim() });
      toast(`Updated “${name.trim()}”`, "success");
      onSaved({ ...editing, name: name.trim(), description: description.trim() });
      return;
    }
    const coll = createCollection({
      name: name.trim(),
      description: description.trim(),
      coverMediaId: null,
    });
    toast(`Created “${coll.name}”`, "success");
    onSaved(coll);
  };

  return (
    <Overlay
      open
      onClose={onClose}
      title={editing ? "Edit collection" : "Create collection"}
      ariaLabel="Collection details"
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mummy & Me"
            maxLength={80}
            className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes this collection special?"
            rows={3}
            maxLength={300}
            className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-[12.5px] text-ink-3">
          <IconFolder width={16} height={16} />
          Add memories from any event, year, or category — collections can mix anything.
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
            {editing ? "Save changes" : "Create collection"}
          </Button>
        </div>
      </form>
    </Overlay>
  );
}