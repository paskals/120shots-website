import { usePhotoStore } from "../../stores/photo-store";
import PhotoCard from "./PhotoCard";
import PhotoDetail from "./PhotoDetail";
import { useState } from "react";
import type { Photo } from "../../types";

interface Props {
  selectable?: boolean;
}

export default function PhotoBrowser({ selectable = false }: Props) {
  const { photos, loading, usage } = usePhotoStore();
  const [detailPhoto, setDetailPhoto] = useState<Photo | null>(null);

  if (loading && photos.length === 0) {
    return <div className="text-zinc-500 text-sm">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="text-zinc-500 text-sm">No photos found.</div>;
  }

  return (
    <>
      <p className="text-xs text-zinc-500 mb-3">{photos.length} photos</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.src}
            photo={photo}
            usageCount={usage[photo.src]?.length || 0}
            selectable={selectable}
            onClick={() => !selectable && setDetailPhoto(photo)}
          />
        ))}
      </div>
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
