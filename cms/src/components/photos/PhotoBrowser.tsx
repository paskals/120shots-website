import { useMemo, useState } from "react";
import { usePhotoStore } from "../../stores/photo-store";
import PhotoCard from "./PhotoCard";
import PhotoDetail from "./PhotoDetail";
import type { Photo } from "../../types";

interface Props {
  selectable?: boolean;
}

interface PhotoGroup {
  label: string;
  photos: Photo[];
}

function groupPhotosByMonth(photos: Photo[]): PhotoGroup[] {
  const groups = new Map<string, Photo[]>();
  const undated: Photo[] = [];

  for (const photo of photos) {
    if (!photo.date) {
      undated.push(photo);
      continue;
    }
    const d = new Date(photo.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(photo);
  }

  // Sort keys descending (newest first)
  const sorted = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));

  const result: PhotoGroup[] = sorted.map(([key, photos]) => {
    const [year, month] = key.split("-");
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
      "en-US",
      { month: "long" }
    );
    return { label: `${monthName} ${year}`, photos };
  });

  if (undated.length > 0) {
    result.push({ label: "No date", photos: undated });
  }

  return result;
}

export default function PhotoBrowser({ selectable = false }: Props) {
  const { photos, loading, usage } = usePhotoStore();
  const [detailPhoto, setDetailPhoto] = useState<Photo | null>(null);

  const groups = useMemo(() => groupPhotosByMonth(photos), [photos]);

  if (loading && photos.length === 0) {
    return <div className="text-zinc-400 text-sm">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="text-zinc-400 text-sm">No photos found.</div>;
  }

  return (
    <>
      <p className="text-xs text-zinc-400 mb-4 pt-4">{photos.length} photos</p>
      {groups.map((group) => (
        <div key={group.label} className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-500 mb-2 sticky top-0 bg-white py-1 z-10">
            {group.label}
            <span className="ml-2 text-xs font-normal text-zinc-400">
              ({group.photos.length})
            </span>
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {group.photos.map((photo) => (
              <PhotoCard
                key={photo.src}
                photo={photo}
                usageCount={usage[photo.src]?.length || 0}
                selectable={selectable}
                onClick={() => !selectable && setDetailPhoto(photo)}
              />
            ))}
          </div>
        </div>
      ))}
      {detailPhoto && (
        <PhotoDetail
          photo={detailPhoto}
          usageEssays={usage[detailPhoto.src] || []}
          onClose={() => setDetailPhoto(null)}
        />
      )}
    </>
  );
}
