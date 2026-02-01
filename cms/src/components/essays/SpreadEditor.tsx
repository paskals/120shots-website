import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Spread, SpreadLayout } from "../../types";
import PhotoSlot from "./PhotoSlot";

function LayoutIcon({ layout, className = "" }: { layout: SpreadLayout; className?: string }) {
  const c = `w-5 h-3.5 ${className}`;
  const fill = "currentColor";
  const r = 0.5;
  switch (layout) {
    case "single":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={20} height={14} rx={r} fill={fill} /></svg>;
    case "duo":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={9.5} height={14} rx={r} fill={fill} /><rect x={10.5} y={0} width={9.5} height={14} rx={r} fill={fill} /></svg>;
    case "duo-l":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={12.5} height={14} rx={r} fill={fill} /><rect x={13.5} y={0} width={6.5} height={14} rx={r} fill={fill} /></svg>;
    case "duo-r":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={6.5} height={14} rx={r} fill={fill} /><rect x={7.5} y={0} width={12.5} height={14} rx={r} fill={fill} /></svg>;
    case "trio":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={6} height={14} rx={r} fill={fill} /><rect x={7} y={0} width={6} height={14} rx={r} fill={fill} /><rect x={14} y={0} width={6} height={14} rx={r} fill={fill} /></svg>;
    case "trio-l":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={12.5} height={14} rx={r} fill={fill} /><rect x={13.5} y={0} width={6.5} height={6.5} rx={r} fill={fill} /><rect x={13.5} y={7.5} width={6.5} height={6.5} rx={r} fill={fill} /></svg>;
    case "trio-r":
      return <svg className={c} viewBox="0 0 20 14"><rect x={0} y={0} width={6.5} height={6.5} rx={r} fill={fill} /><rect x={0} y={7.5} width={6.5} height={6.5} rx={r} fill={fill} /><rect x={7.5} y={0} width={12.5} height={14} rx={r} fill={fill} /></svg>;
    default:
      return null;
  }
}

const LAYOUTS: SpreadLayout[] = [
  "single", "duo", "duo-l", "duo-r", "trio", "trio-l", "trio-r",
];

interface Props {
  spread: Spread;
  index: number;
  photoInfoMap: Record<string, { rollName: string; sequence: string; date?: string }>;
  onUpdateLayout: (layout: SpreadLayout) => void;
  onUpdateCaption: (caption: string) => void;
  onRemovePhoto: (slotIndex: number) => void;
  onDelete: () => void;
}

const SLOTS_PER_LAYOUT: Record<SpreadLayout, number> = {
  single: 1,
  duo: 2,
  "duo-h": 2,
  "duo-l": 2,
  "duo-r": 2,
  trio: 3,
  "trio-l": 3,
  "trio-r": 3,
};

export default function SpreadEditor({
  spread,
  index,
  photoInfoMap,
  onUpdateLayout,
  onUpdateCaption,
  onRemovePhoto,
  onDelete,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const slotCount = SLOTS_PER_LAYOUT[spread.layout];
  const isSingle = spread.layout === "single";
  const hasPhotos = spread.photos.some((p) => p.src);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `spread-${index}`,
    data: { type: "spread", index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSlotEmphasis = (slotIdx: number): boolean => {
    if (spread.layout === "duo-l" && slotIdx === 0) return true;
    if (spread.layout === "duo-r" && slotIdx === 1) return true;
    if (spread.layout === "trio-l" && slotIdx === 0) return true;
    if (spread.layout === "trio-r" && slotIdx === 2) return true;
    return false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-zinc-200 rounded-xl p-4 shadow-sm transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 transition-colors"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z" />
          </svg>
        </button>
        <span className="text-xs text-zinc-400">#{index + 1}</span>
        <div className="flex gap-1">
          {LAYOUTS.map((l) => (
            <button
              key={l}
              onClick={() => onUpdateLayout(l)}
              title={l}
              className={`p-1 rounded transition-colors ${
                spread.layout === l
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
              }`}
            >
              <LayoutIcon layout={l} />
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <button
            onClick={() => {
              if (hasPhotos) {
                setShowDeleteConfirm(true);
              } else {
                onDelete();
              }
            }}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            Delete
          </button>
          {showDeleteConfirm && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDeleteConfirm(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-zinc-200 rounded-lg p-3 shadow-lg w-56">
                <p className="text-xs text-zinc-600 mb-2">
                  This spread has photos. Delete it?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDelete();
                    }}
                    className="px-2.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Photo slots */}
      <div className="flex gap-2">
        {Array.from({ length: slotCount }).map((_, slotIdx) => (
          <PhotoSlot
            key={slotIdx}
            spreadIndex={index}
            slotIndex={slotIdx}
            photo={spread.photos[slotIdx]}
            photoInfo={spread.photos[slotIdx]?.src ? photoInfoMap[spread.photos[slotIdx].src] : undefined}
            onRemove={() => onRemovePhoto(slotIdx)}
            emphasized={getSlotEmphasis(slotIdx)}
            isSingleLayout={isSingle}
          />
        ))}
      </div>

      {/* Caption */}
      <input
        type="text"
        value={spread.caption || ""}
        onChange={(e) => onUpdateCaption(e.target.value)}
        placeholder="Caption (optional)"
        className="mt-3 w-full bg-transparent border-b border-zinc-200 focus:border-zinc-400 px-1 py-1 text-sm text-zinc-600 placeholder:text-zinc-300 focus:outline-none"
      />
    </div>
  );
}
