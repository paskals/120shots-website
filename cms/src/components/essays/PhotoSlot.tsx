import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { SpreadPhoto } from "../../types";

interface Props {
  spreadIndex: number;
  slotIndex: number;
  photo: SpreadPhoto | undefined;
  photoInfo?: { rollName: string; sequence: string };
  onRemove: () => void;
  emphasized?: boolean;
  isSingleLayout?: boolean;
}

export default function PhotoSlot({
  spreadIndex,
  slotIndex,
  photo,
  photoInfo,
  onRemove,
  emphasized = false,
  isSingleLayout = false,
}: Props) {
  const droppableId = `slot-${spreadIndex}-${slotIndex}`;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "slot", spreadIndex, slotIndex },
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag-slot-${spreadIndex}-${slotIndex}`,
    data: {
      type: "slot-photo",
      spreadIndex,
      slotIndex,
      photo,
    },
    disabled: !photo?.src,
  });

  const hasPhoto = photo && photo.src;

  return (
    <div
      ref={setDropRef}
      className={`relative rounded-lg overflow-hidden transition-all ${
        emphasized ? "flex-[1.4]" : "flex-1"
      } ${isOver ? "ring-2 ring-blue-500" : ""}`}
    >
      {hasPhoto ? (
        <div
          ref={setDragRef}
          {...attributes}
          {...listeners}
          className={`bg-zinc-100 cursor-grab active:cursor-grabbing flex items-center justify-center ${
            isSingleLayout ? "max-h-80" : "aspect-[4/3]"
          } ${isDragging ? "opacity-40" : ""}`}
        >
          <img
            src={photo.src}
            alt={photo.alt}
            className={`rounded-lg object-contain ${
              isSingleLayout
                ? "max-h-80 max-w-full"
                : "max-w-full max-h-full"
            }`}
            loading="lazy"
            draggable={false}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-red-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {photoInfo && (
            <div className="absolute bottom-1.5 left-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-black/50 text-white rounded">
                {photoInfo.rollName} #{photoInfo.sequence}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center">
          <span className="text-xs text-zinc-400">Drop photo</span>
        </div>
      )}
    </div>
  );
}
