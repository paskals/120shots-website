import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Photo, Essay } from "../../types";

interface DraggablePhotoProps {
  photo: { src: string; alt: string; rollName?: string };
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
      className={`relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="aspect-square bg-zinc-900">
        <img
          src={photo.src}
          alt={photo.alt}
          className="w-full h-full object-cover"
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
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-zinc-400 truncate">
            {photo.rollName}
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

  useEffect(() => {
    // Fetch photos from essay's rolls
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
  const filtered = search
    ? displayPhotos.filter(
        (p) =>
          p.alt.toLowerCase().includes(search.toLowerCase()) ||
          p.labels?.some((l) =>
            l.toLowerCase().includes(search.toLowerCase())
          ) ||
          p.rollName.toLowerCase().includes(search.toLowerCase())
      )
    : displayPhotos;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(false)}
            className={`text-xs px-2 py-1 rounded ${
              !showAll
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Roll photos
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`text-xs px-2 py-1 rounded ${
              showAll
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All photos
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((photo) => (
            <DraggablePhoto
              key={photo.src}
              photo={photo}
              usageCount={usage[photo.src]?.length || 0}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-600 text-center mt-4">
            No photos found
          </p>
        )}
      </div>
    </div>
  );
}
