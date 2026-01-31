import type { Photo } from "../../types";

interface Props {
  photo: Photo;
  usageEssays: string[];
  onClose: () => void;
}

export default function PhotoDetail({ photo, usageEssays, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={photo.src}
            alt={photo.alt}
            className="w-full max-h-[50vh] object-contain bg-black rounded-t-xl"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-zinc-300">{photo.alt}</p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-zinc-500">Roll:</span>{" "}
              <span className="text-zinc-300">{photo.rollId}</span>
            </div>
            <div>
              <span className="text-zinc-500">Film:</span>{" "}
              <span className="text-zinc-300">{photo.filmId}</span>
            </div>
            {photo.camera && (
              <div>
                <span className="text-zinc-500">Camera:</span>{" "}
                <span className="text-zinc-300">{photo.camera}</span>
              </div>
            )}
            {photo.date && (
              <div>
                <span className="text-zinc-500">Date:</span>{" "}
                <span className="text-zinc-300">
                  {new Date(photo.date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-zinc-500">Sequence:</span>{" "}
              <span className="text-zinc-300">{photo.sequence}</span>
            </div>
            {photo.location && (
              <div>
                <span className="text-zinc-500">Location:</span>{" "}
                <span className="text-zinc-300">{photo.location}</span>
              </div>
            )}
          </div>

          {photo.labels && photo.labels.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Labels</p>
              <div className="flex flex-wrap gap-1">
                {photo.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {usageEssays.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Used in essays</p>
              <div className="flex flex-col gap-1">
                {usageEssays.map((id) => (
                  <a
                    key={id}
                    href={`/essays/${id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {id}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-zinc-600 break-all">{photo.src}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
