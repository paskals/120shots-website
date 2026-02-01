import { create } from "zustand";
import type { Photo, Film, Roll, PhotoUsage } from "../types";

interface PhotoFilters {
  roll: string;
  film: string;
  camera: string;
  unused: boolean;
  search: string;
}

interface PhotoStore {
  photos: Photo[];
  films: Film[];
  rolls: Roll[];
  cameras: string[];
  usage: PhotoUsage;
  filters: PhotoFilters;
  loading: boolean;
  selectedPhotos: Set<string>; // src strings for multi-select

  setFilter: (key: keyof PhotoFilters, value: any) => void;
  clearFilters: () => void;
  fetchPhotos: () => Promise<void>;
  fetchMeta: () => Promise<void>;
  toggleSelect: (src: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

const defaultFilters: PhotoFilters = {
  roll: "",
  film: "",
  camera: "",
  unused: false,
  search: "",
};

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  films: [],
  rolls: [],
  cameras: [],
  usage: {},
  filters: { ...defaultFilters },
  loading: false,
  selectedPhotos: new Set(),

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }));
    get().fetchPhotos();
  },

  clearFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().fetchPhotos();
  },

  fetchPhotos: async () => {
    set({ loading: true });
    const { filters } = get();
    const params = new URLSearchParams();
    if (filters.roll) params.set("roll", filters.roll);
    if (filters.film) params.set("film", filters.film);
    if (filters.camera) params.set("camera", filters.camera);
    if (filters.unused) params.set("unused", "true");
    if (filters.search) params.set("search", filters.search);

    try {
      const [photosRes, usageRes] = await Promise.all([
        fetch(`/api/photos?${params}`),
        fetch("/api/usage"),
      ]);
      const photos = await photosRes.json();
      const usage = await usageRes.json();
      set({ photos, usage, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchMeta: async () => {
    try {
      const [filmsRes, rollsRes, camerasRes] = await Promise.all([
        fetch("/api/films"),
        fetch("/api/rolls"),
        fetch("/api/cameras"),
      ]);
      const films = await filmsRes.json();
      const rolls = await rollsRes.json();
      const cameras = await camerasRes.json();
      set({ films, rolls, cameras });
    } catch {
      // silent
    }
  },

  toggleSelect: (src) => {
    set((s) => {
      const next = new Set(s.selectedPhotos);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return { selectedPhotos: next };
    });
  },

  clearSelection: () => set({ selectedPhotos: new Set() }),

  selectAll: () => {
    const { photos } = get();
    set({ selectedPhotos: new Set(photos.map((p) => p.src)) });
  },
}));
