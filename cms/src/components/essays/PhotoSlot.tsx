import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { SpreadPhoto } from "../../types";

interface Props {
  spreadIndex: number;
  slotIndex: number;
  photo: SpreadPhoto | undefined;
  onRemove: () => void;
  emphasized?: boolean;
}

export default function PhotoSlot({
  spreadIndex,
  slotIndex,
  photo,
  onRemove,
  emphasized = false,
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
          className={`aspect-[4/3] bg-zinc-900 cursor-grab active:cursor-grabbing ${
            isDragging ? "opacity-40" : ""
          }`}
        >
          <img
            src={photo.src}
            alt={photo.alt}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
            draggable={false}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-red-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="aspect-[4/3] bg-zinc-900/50 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
          <span className="text-xs text-zinc-600">Drop photo</span>
        </div>
      )}
    </div>
  );
}
