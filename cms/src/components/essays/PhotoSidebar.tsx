import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Photo, Essay } from "../../types";

interface DraggablePhotoProps {
  photo: { src: string; alt: string; rollName?: string; sequence?: string; date?: string };
  usageCount: number;
}

function DraggablePhoto({ photo, usageCount }: DraggablePhotoProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${photo.src}`,
    data: {
      type: "sidebar-photo",
      photo: { src: photo.src, alt: photo.alt },
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={photo.date ? new Date(photo.date).toLocaleDateString() : undefined}
      className={`relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="aspect-square bg-zinc-100 flex items-center justify-center">
        <img
          src={photo.src}
          alt={photo.alt}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="absolute top-1 right-1">
        <span
          className={`w-2 h-2 rounded-full block ${
            usageCount > 0 ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
      </div>
      {photo.rollName && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
          <p className="text-[10px] text-white truncate">
            {photo.rollName}{photo.sequence ? ` #${photo.sequence}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  essay: Essay;
}

export default function PhotoSidebar({ essay }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [usage, setUsage] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [unusedOnly, setUnusedOnly] = useState(false);

  useEffect(() => {
    const rollIds = essay.rolls || [];
    const fetchRollPhotos = async () => {
      const res = await fetch("/api/photos");
      const all: Photo[] = await res.json();
      const usageRes = await fetch("/api/usage");
      const usageData = await usageRes.json();
      setUsage(usageData);
      setAllPhotos(all);

      if (rollIds.length > 0) {
        setPhotos(all.filter((p) => rollIds.includes(p.rollId)));
      } else {
        setPhotos(all);
      }
    };
    fetchRollPhotos();
  }, [essay.rolls]);

  const displayPhotos = showAll ? allPhotos : photos;
  let filtered = unusedOnly
    ? displayPhotos.filter((p) => !usage[p.src]?.length)
    : displayPhotos;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.alt.toLowerCase().includes(q) ||
        p.labels?.some((l) => l.toLowerCase().includes(q)) ||
        p.rollName.toLowerCase().includes(q)
    );
  }
  filtered = [...filtered].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return -1;
    if (!b.date) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-200 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(false)}
            className={`text-xs px-2 py-1 rounded ${
              !showAll
                ? "bg-zinc-200 text-zinc-800"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Roll photos
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`text-xs px-2 py-1 rounded ${
              showAll
                ? "bg-zinc-200 text-zinc-800"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            All photos
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-white border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-blue-400"
          />
          <label className="flex items-center gap-1 text-xs text-zinc-500 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={unusedOnly}
              onChange={(e) => setUnusedOnly(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Unused
          </label>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((photo) => (
            <DraggablePhoto
              key={photo.src}
              photo={{ src: photo.src, alt: photo.alt, rollName: photo.rollName, sequence: photo.sequence, date: photo.date }}
              usageCount={usage[photo.src]?.length || 0}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-400 text-center mt-4">
            No photos found
          </p>
        )}
      </div>
    </div>
  );
}
