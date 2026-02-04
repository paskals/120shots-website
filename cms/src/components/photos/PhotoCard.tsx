import { usePhotoStore } from "../../stores/photo-store";
import type { Photo } from "../../types";

interface Props {
  photo: Photo;
  usageCount: number;
  selectable?: boolean;
  onClick?: () => void;
}

export default function PhotoCard({
  photo,
  usageCount,
  selectable = false,
  onClick,
}: Props) {
  const { selectedPhotos, toggleSelect } = usePhotoStore();
  const isSelected = selectedPhotos.has(photo.src);

  const handleClick = () => {
    if (selectable) {
      toggleSelect(photo.src);
    } else {
      onClick?.();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-transparent hover:border-zinc-300"
      }`}
    >
      <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center">
        <img
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          className="max-w-full max-h-full object-contain"
        />
      </div>
      {photo.hidden && (
        <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center pointer-events-none">
          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded">
            Hidden
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate">{photo.rollName}</p>
        {photo.date && (
          <p className="text-xs text-white/70">
            {new Date(photo.date).toLocaleDateString()}
          </p>
        )}
      </div>
      {/* Roll badge */}
      <div className="absolute top-1.5 left-1.5">
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-black/50 text-white rounded">
          {photo.rollName} #{photo.sequence}
        </span>
      </div>
      {/* Usage indicator */}
      {!selectable && (
        <div className="absolute top-1.5 right-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full block ${
              usageCount > 0 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            title={usageCount > 0 ? `In ${usageCount} essay(s)` : "Unused"}
          />
        </div>
      )}
      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-1.5 right-1.5">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? "bg-blue-500 border-blue-500"
                : "border-white bg-black/30"
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
