import { useEffect } from "react";
import { usePhotoStore } from "../stores/photo-store";
import PhotoBrowser from "../components/photos/PhotoBrowser";
import PhotoFilters from "../components/photos/PhotoFilters";

export default function PhotoBrowserPage() {
  const { fetchPhotos, fetchMeta } = usePhotoStore();

  useEffect(() => {
    fetchMeta();
    fetchPhotos();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b border-zinc-200 p-4">
        <h2 className="text-xl font-semibold mb-3">Photos</h2>
        <PhotoFilters />
      </div>
      <div className="flex-1 overflow-auto px-3 pb-4">
        <PhotoBrowser />
      </div>
    </div>
  );
}
