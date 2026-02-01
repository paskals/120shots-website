import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhotoStore } from "../stores/photo-store";
import { useEssayStore } from "../stores/essay-store";
import PhotoBrowser from "../components/photos/PhotoBrowser";
import PhotoFilters from "../components/photos/PhotoFilters";
import type { Spread, SpreadLayout } from "../types";

export default function NewEssayPage() {
  const { fetchPhotos, fetchMeta, selectedPhotos, photos, clearSelection } =
    usePhotoStore();
  const { createEssay } = useEssayStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState(
    `Draft ${new Date().toISOString().split("T")[0]}`
  );

  useEffect(() => {
    fetchMeta();
    fetchPhotos();
    clearSelection();
  }, []);

  const handleCreate = async () => {
    if (selectedPhotos.size === 0) return;

    const selected = photos.filter((p) => selectedPhotos.has(p.src));

    const spreads: Spread[] = [];
    const layoutPattern: SpreadLayout[] = ["single", "duo", "trio"];
    let patternIndex = 0;
    let photoIndex = 0;

    while (photoIndex < selected.length) {
      const layout = layoutPattern[patternIndex % layoutPattern.length];
      const needed = layout === "single" ? 1 : layout === "duo" ? 2 : 3;
      const available = selected.length - photoIndex;
      const count = Math.min(needed, available);
      const actualLayout: SpreadLayout =
        count === 1 ? "single" : count === 2 ? "duo" : "trio";

      spreads.push({
        layout: actualLayout,
        photos: selected.slice(photoIndex, photoIndex + count).map((p) => ({
          src: p.src,
          alt: p.alt,
        })),
      });

      photoIndex += count;
      patternIndex++;
    }

    const rolls = [...new Set(selected.map((p) => p.rollId))];
    const filmStocks = [...new Set(selected.map((p) => p.filmId))];
    const cover = selected[0]
      ? { src: selected[0].src, alt: selected[0].alt }
      : undefined;

    const id = await createEssay({
      title: title.trim(),
      description: "",
      pubDate: new Date().toISOString().split("T")[0],
      author: "paskal",
      rolls,
      filmStocks,
      tags: [],
      cover,
      spreads,
    });

    clearSelection();
    navigate(`/essays/${id}`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b border-zinc-200 p-4">
        <h2 className="text-xl font-semibold mb-3">New Essay</h2>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Essay title..."
            className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleCreate}
            disabled={selectedPhotos.size === 0 || !title.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Essay ({selectedPhotos.size} photos)
          </button>
        </div>
        <PhotoFilters />
      </div>
      <div className="flex-1 overflow-auto p-4">
        <p className="text-sm text-zinc-500 mb-3">
          Click photos to select them for the new essay.
        </p>
        <PhotoBrowser selectable />
      </div>
    </div>
  );
}
