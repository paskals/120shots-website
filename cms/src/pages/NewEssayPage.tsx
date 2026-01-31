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
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetchMeta();
    fetchPhotos();
    clearSelection();
  }, []);

  const handleCreate = async () => {
    if (selectedPhotos.size === 0) return;

    // Get selected photos in their original order
    const selected = photos.filter((p) => selectedPhotos.has(p.src));

    // Auto-arrange into spreads: single -> duo -> trio cycle
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

    // Gather roll and film info
    const rolls = [...new Set(selected.map((p) => p.rollId))];
    const filmStocks = [...new Set(selected.map((p) => p.filmId))];
    const cover = selected[0]
      ? { src: selected[0].src, alt: selected[0].alt }
      : undefined;

    const id = await createEssay({
      title: title || "Draft essay",
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
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-xl font-semibold mb-3">New Essay</h2>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Essay title..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={handleCreate}
            disabled={selectedPhotos.size === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
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
