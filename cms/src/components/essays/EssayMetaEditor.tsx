import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEssayStore } from "../../stores/essay-store";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Less aggressive version for live editing - allows trailing hyphens while typing
function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+/g, "-");
}

export default function EssayMetaEditor() {
  const { current, dirty, updateMeta, renameEssay } = useEssayStore();
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [slugInitialized, setSlugInitialized] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  if (!current) return null;

  // Reset slug state when essay changes
  if (slugInitialized !== current.id) {
    setSlug(current.id);
    setSlugInitialized(current.id);
    setRenameError(null);
  }

  const slugUnchanged = slug === current.id;
  const slugEmpty = slug.trim() === "";
  const renameDisabled = slugUnchanged || slugEmpty || dirty || renaming;

  const handleRename = async () => {
    const finalSlug = slugify(slug);
    if (!finalSlug) {
      setRenameError("Slug cannot be empty");
      return;
    }
    setRenaming(true);
    setRenameError(null);
    try {
      const newId = await renameEssay(finalSlug);
      navigate(`/essays/${newId}`, { replace: true });
    } catch (err: any) {
      setRenameError(err.message || "Rename failed");
    } finally {
      setRenaming(false);
    }
  };

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
      {/* Slug / filename editor */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Slug (filename)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(sanitizeSlug(e.target.value));
              setRenameError(null);
            }}
            className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 font-mono focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleRename}
            disabled={renameDisabled}
            className="px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {renaming ? "Renaming..." : "Rename"}
          </button>
        </div>
        {dirty && !slugUnchanged && (
          <p className="text-xs text-amber-600 mt-1">Save your changes before renaming</p>
        )}
        {renameError && (
          <p className="text-xs text-red-600 mt-1">{renameError}</p>
        )}
      </div>

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
