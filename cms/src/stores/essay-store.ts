import { create } from "zustand";
import type { Essay, EssaySummary, Spread, SpreadLayout } from "../types";

const MAX_HISTORY = 50;

interface EssayStore {
  essays: EssaySummary[];
  current: Essay | null;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  history: Essay[];
  future: Essay[];

  fetchEssays: () => Promise<void>;
  fetchEssay: (id: string) => Promise<void>;
  setCurrent: (essay: Essay | null) => void;
  markDirty: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Essay metadata
  updateMeta: (fields: Partial<Essay>) => void;

  // Spread operations
  addSpread: (layout?: SpreadLayout) => void;
  removeSpread: (index: number) => void;
  updateSpread: (index: number, spread: Partial<Spread>) => void;
  changeLayout: (index: number, layout: SpreadLayout) => void;
  reorderSpreads: (fromIndex: number, toIndex: number) => void;

  // Photo slot operations
  setPhoto: (
    spreadIndex: number,
    slotIndex: number,
    photo: { src: string; alt: string }
  ) => void;
  removePhoto: (spreadIndex: number, slotIndex: number) => void;
  movePhoto: (
    fromSpread: number,
    fromSlot: number,
    toSpread: number,
    toSlot: number
  ) => void;

  // Persistence
  save: () => Promise<void>;
  createEssay: (essay: Omit<Essay, "id">) => Promise<string>;
  renameEssay: (newId: string) => Promise<string>;
}

export const useEssayStore = create<EssayStore>((set, get) => {
  /** Snapshot current essay onto history before a mutation */
  const pushHistory = () => {
    const { current, history } = get();
    if (!current) return;
    const next = [...history, structuredClone(current)];
    if (next.length > MAX_HISTORY) next.shift();
    set({ history: next, future: [] });
  };

  return {
    essays: [],
    current: null,
    dirty: false,
    loading: false,
    saving: false,
    history: [],
    future: [],

    fetchEssays: async () => {
      set({ loading: true });
      try {
        const res = await fetch("/api/essays");
        const essays = await res.json();
        set({ essays, loading: false });
      } catch {
        set({ loading: false });
      }
    },

    fetchEssay: async (id: string) => {
      set({ loading: true, dirty: false, history: [], future: [] });
      try {
        const res = await fetch(`/api/essays/${id}`);
        if (!res.ok) throw new Error("Not found");
        const essay = await res.json();
        set({ current: essay, loading: false });
      } catch {
        set({ current: null, loading: false });
      }
    },

    setCurrent: (essay) => set({ current: essay, dirty: false, history: [], future: [] }),
    markDirty: () => set({ dirty: true }),

    undo: () => {
      const { history, current, future } = get();
      if (history.length === 0 || !current) return;
      const previous = history[history.length - 1];
      set({
        current: previous,
        history: history.slice(0, -1),
        future: [...future, structuredClone(current)],
        dirty: true,
      });
    },

    redo: () => {
      const { history, current, future } = get();
      if (future.length === 0 || !current) return;
      const next = future[future.length - 1];
      set({
        current: next,
        future: future.slice(0, -1),
        history: [...history, structuredClone(current)],
        dirty: true,
      });
    },

    updateMeta: (fields) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      set({ current: { ...current, ...fields }, dirty: true });
    },

    addSpread: (layout = "single") => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const newSpread: Spread = { layout, photos: [] };
      set({
        current: { ...current, spreads: [...current.spreads, newSpread] },
        dirty: true,
      });
    },

    removeSpread: (index) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const spreads = current.spreads.filter((_, i) => i !== index);
      set({ current: { ...current, spreads }, dirty: true });
    },

    updateSpread: (index, partial) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const spreads = [...current.spreads];
      spreads[index] = { ...spreads[index], ...partial };
      set({ current: { ...current, spreads }, dirty: true });
    },

    changeLayout: (index, layout) => {
      const { current } = get();
      if (!current) return;
      pushHistory();

      const slotsPerLayout: Record<string, number> = {
        single: 1, duo: 2, "duo-h": 2, "duo-l": 2, "duo-r": 2,
        trio: 3, "trio-l": 3, "trio-r": 3,
      };

      const spreads = [...current.spreads];
      const oldSpread = spreads[index];
      const newSlotCount = slotsPerLayout[layout] || 1;
      const existingPhotos = oldSpread.photos.filter((p) => p.src);

      // Photos that fit in the new layout
      const kept = existingPhotos.slice(0, newSlotCount);
      // Overflow photos that no longer fit
      const overflow = existingPhotos.slice(newSlotCount);

      spreads[index] = { ...oldSpread, layout, photos: kept };

      // Insert overflow photos as single spreads right after
      if (overflow.length > 0) {
        const newSpreads: Spread[] = overflow.map((photo) => ({
          layout: "single" as SpreadLayout,
          photos: [photo],
        }));
        spreads.splice(index + 1, 0, ...newSpreads);
      }

      set({ current: { ...current, spreads }, dirty: true });
    },

    reorderSpreads: (fromIndex, toIndex) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const spreads = [...current.spreads];
      const [moved] = spreads.splice(fromIndex, 1);
      spreads.splice(toIndex, 0, moved);
      set({ current: { ...current, spreads }, dirty: true });
    },

    setPhoto: (spreadIndex, slotIndex, photo) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const spreads = [...current.spreads];
      const spread = { ...spreads[spreadIndex] };
      const photos = [...spread.photos];
      // Extend array if needed
      while (photos.length <= slotIndex) {
        photos.push({ src: "", alt: "" });
      }
      photos[slotIndex] = { src: photo.src, alt: photo.alt };
      spread.photos = photos;
      spreads[spreadIndex] = spread;
      set({ current: { ...current, spreads }, dirty: true });
    },

    removePhoto: (spreadIndex, slotIndex) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const spreads = [...current.spreads];
      const spread = { ...spreads[spreadIndex] };
      const photos = [...spread.photos];
      photos.splice(slotIndex, 1);
      spread.photos = photos;
      spreads[spreadIndex] = spread;
      set({ current: { ...current, spreads }, dirty: true });
    },

    movePhoto: (fromSpread, fromSlot, toSpread, toSlot) => {
      const { current } = get();
      if (!current) return;
      pushHistory();
      const spreads = current.spreads.map((s) => ({
        ...s,
        photos: [...s.photos],
      }));

      const photo = spreads[fromSpread].photos[fromSlot];
      if (!photo) return;

      // If target slot has a photo, swap
      const targetPhoto = spreads[toSpread].photos[toSlot];
      if (targetPhoto?.src) {
        spreads[fromSpread].photos[fromSlot] = targetPhoto;
      } else {
        spreads[fromSpread].photos.splice(fromSlot, 1);
      }

      // Extend target array if needed
      while (spreads[toSpread].photos.length <= toSlot) {
        spreads[toSpread].photos.push({ src: "", alt: "" });
      }
      spreads[toSpread].photos[toSlot] = photo;

      set({ current: { ...current, spreads }, dirty: true });
    },

    save: async () => {
      const { current } = get();
      if (!current) return;
      set({ saving: true });
      try {
        await fetch(`/api/essays/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
        set({ saving: false, dirty: false });
      } catch {
        set({ saving: false });
      }
    },

    createEssay: async (essay) => {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(essay),
      });
      const { id } = await res.json();
      return id;
    },

    renameEssay: async (newId: string) => {
      const { current } = get();
      if (!current) throw new Error("No essay loaded");
      const res = await fetch(`/api/essays/${current.id}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rename failed");
      set({ current: { ...current, id: newId }, dirty: false });
      return newId;
    },
  };
});
