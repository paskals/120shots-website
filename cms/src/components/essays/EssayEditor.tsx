import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEssayStore } from "../../stores/essay-store";
import SpreadEditor from "./SpreadEditor";
import PhotoSidebar from "./PhotoSidebar";
import EssayMetaEditor from "./EssayMetaEditor";
import type { Photo } from "../../types";

export default function EssayEditor() {
  const {
    current,
    dirty,
    saving,
    save,
    updateSpread,
    changeLayout,
    removeSpread,
    addSpread,
    removePhoto,
    setPhoto,
    movePhoto,
    reorderSpreads,
  } = useEssayStore();

  const [activeData, setActiveData] = useState<any>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    fetch("/api/photos").then((r) => r.json()).then(setAllPhotos);
  }, []);

  const photoInfoMap = useMemo(() => {
    const map: Record<string, { rollName: string; sequence: string }> = {};
    for (const p of allPhotos) {
      map[p.src] = { rollName: p.rollName, sequence: p.sequence };
    }
    return map;
  }, [allPhotos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!current) return null;

  const spreadIds = current.spreads.map((_, i) => `spread-${i}`);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveData(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Sidebar photo dropped on a slot
    if (activeType === "sidebar-photo" && overType === "slot") {
      const { spreadIndex, slotIndex } = over.data.current as any;
      const { photo } = active.data.current as any;
      setPhoto(spreadIndex, slotIndex, photo);
      return;
    }

    // Slot photo dropped on another slot (move/swap)
    if (activeType === "slot-photo" && overType === "slot") {
      const from = active.data.current as any;
      const to = over.data.current as any;
      if (
        from.spreadIndex === to.spreadIndex &&
        from.slotIndex === to.slotIndex
      )
        return;
      movePhoto(from.spreadIndex, from.slotIndex, to.spreadIndex, to.slotIndex);
      return;
    }

    // Spread reorder
    if (activeType === "spread" && overType === "spread") {
      const fromIndex = (active.data.current as any).index;
      const toIndex = (over.data.current as any).index;
      if (fromIndex !== toIndex) {
        reorderSpreads(fromIndex, toIndex);
      }
      return;
    }
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Photo Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-zinc-200 bg-zinc-50">
        <PhotoSidebar essay={current} />
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-zinc-200 p-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold truncate flex-1">
            {current.title}
          </h2>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showMeta
                ? "bg-zinc-200 text-zinc-800"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Metadata
          </button>
          <button
            onClick={() => save()}
            disabled={!dirty || saving || !current.title.trim()}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              dirty && current.title.trim()
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {saving ? "Saving..." : !current.title.trim() ? "Title required" : dirty ? "Save" : "Saved"}
          </button>
        </div>

        {/* Meta panel */}
        {showMeta && (
          <div className="border-b border-zinc-200 p-4 bg-zinc-50">
            <EssayMetaEditor />
          </div>
        )}

        {/* Spreads */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-50">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={spreadIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                {current.spreads.map((spread, i) => (
                  <SpreadEditor
                    key={`spread-${i}`}
                    spread={spread}
                    index={i}
                    photoInfoMap={photoInfoMap}
                    onUpdateLayout={(layout) =>
                      changeLayout(i, layout)
                    }
                    onUpdateCaption={(caption) =>
                      updateSpread(i, { caption: caption || undefined })
                    }
                    onRemovePhoto={(slotIndex) =>
                      removePhoto(i, slotIndex)
                    }
                    onDelete={() => removeSpread(i)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeData?.photo?.src ? (
                <div className="w-24 h-24 rounded-lg overflow-hidden shadow-2xl opacity-80">
                  <img
                    src={activeData.photo.src}
                    alt={activeData.photo.alt}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <div className="max-w-4xl mx-auto mt-4">
            <button
              onClick={() => addSpread()}
              className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-sm text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              + Add Spread
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
