import { useMemo } from "react";
import { useEssayStore } from "../../stores/essay-store";

export default function EssayMetaEditor() {
  const { current, updateMeta } = useEssayStore();
  if (!current) return null;

  const spreadPhotos = useMemo(() => {
    const photos: { src: string; alt: string }[] = [];
    for (const spread of current.spreads) {
      for (const p of spread.photos) {
        if (p.src && !photos.some((x) => x.src === p.src)) {
          photos.push({ src: p.src, alt: p.alt });
        }
      }
    }
    return photos;
  }, [current.spreads]);

  return (
    <div className="space-y-3">
      {/* Cover photo picker */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Cover Photo</label>
        <div className="flex items-start gap-3">
          {current.cover?.src ? (
            <div className="w-24 h-16 rounded bg-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img
                src={current.cover.src}
                alt={current.cover.alt}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-16 rounded bg-zinc-100 flex-shrink-0 flex items-center justify-center">
              <span className="text-[10px] text-zinc-400">No cover</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {spreadPhotos.map((photo) => (
              <button
                key={photo.src}
                onClick={() => updateMeta({ cover: { src: photo.src, alt: photo.alt } })}
                className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center transition-all ${
                  current.cover?.src === photo.src
                    ? "ring-2 ring-blue-500"
                    : "ring-1 ring-zinc-200 hover:ring-zinc-400"
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </button>
            ))}
            {spreadPhotos.length === 0 && (
              <span className="text-xs text-zinc-400 self-center">
                Add photos to spreads first
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Title</label>
        <input
          type="text"
          value={current.title}
          onChange={(e) => updateMeta({ title: e.target.value })}
          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Description</label>
        <textarea
          value={current.description}
          onChange={(e) => updateMeta({ description: e.target.value })}
          rows={2}
          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Publish Date
          </label>
          <input
            type="date"
            value={current.pubDate}
            onChange={(e) => updateMeta({ pubDate: e.target.value })}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Author</label>
          <input
            type="text"
            value={current.author}
            onChange={(e) => updateMeta({ author: e.target.value })}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={current.tags?.join(", ") || ""}
          onChange={(e) =>
            updateMeta({
              tags: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Rolls (comma-separated IDs)
        </label>
        <input
          type="text"
          value={current.rolls?.join(", ") || ""}
          onChange={(e) =>
            updateMeta({
              rolls: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Film Stocks (comma-separated IDs)
        </label>
        <input
          type="text"
          value={current.filmStocks?.join(", ") || ""}
          onChange={(e) =>
            updateMeta({
              filmStocks: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
        />
      </div>
    </div>
  );
}
