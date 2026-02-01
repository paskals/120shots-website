import { useEffect } from "react";
import type { Photo } from "../../types";

interface Props {
  photo: Photo;
  usageEssays: string[];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function PhotoDetail({ photo, usageEssays, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onPrev, onNext, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-zinc-100 rounded-t-xl">
          <img
            src={photo.src}
            alt={photo.alt}
            className="w-full max-h-[50vh] object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-zinc-700">{photo.alt}</p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-zinc-400">Roll:</span>{" "}
              <span className="text-zinc-700">{photo.rollId}</span>
            </div>
            <div>
              <span className="text-zinc-400">Film:</span>{" "}
              <span className="text-zinc-700">{photo.filmId}</span>
            </div>
            {photo.camera && (
              <div>
                <span className="text-zinc-400">Camera:</span>{" "}
                <span className="text-zinc-700">{photo.camera}</span>
              </div>
            )}
            {photo.date && (
              <div>
                <span className="text-zinc-400">Date:</span>{" "}
                <span className="text-zinc-700">
                  {new Date(photo.date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-zinc-400">Sequence:</span>{" "}
              <span className="text-zinc-700">{photo.sequence}</span>
            </div>
            {photo.location && (
              <div>
                <span className="text-zinc-400">Location:</span>{" "}
                <span className="text-zinc-700">{photo.location}</span>
              </div>
            )}
          </div>

          {photo.labels && photo.labels.length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 mb-1.5">Labels</p>
              <div className="flex flex-wrap gap-1">
                {photo.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-0.5 text-xs bg-zinc-100 text-zinc-600 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {usageEssays.length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 mb-1.5">Used in essays</p>
              <div className="flex flex-col gap-1">
                {usageEssays.map((id) => (
                  <a
                    key={id}
                    href={`/essays/${id}`}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {id}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-zinc-400 break-all">{photo.src}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
