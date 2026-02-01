import type { SpreadLayout } from "../../types";

interface Props {
  value: SpreadLayout;
  onChange: (layout: SpreadLayout) => void;
}

const LAYOUTS: { value: SpreadLayout; label: string; diagram: string }[] = [
  { value: "single", label: "Single", diagram: "[ ======== ]" },
  { value: "duo", label: "Duo", diagram: "[ ==== | ==== ]" },
  { value: "duo-l", label: "Duo L", diagram: "[ ====== | ==== ]" },
  { value: "duo-r", label: "Duo R", diagram: "[ ==== | ====== ]" },
  { value: "trio", label: "Trio", diagram: "[ === | === | === ]" },
  { value: "trio-l", label: "Trio L", diagram: "[ ====== | =:= ]" },
  { value: "trio-r", label: "Trio R", diagram: "[ =:= | ====== ]" },
];

export default function LayoutPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1 w-48">
      {LAYOUTS.map((l) => (
        <button
          key={l.value}
          onClick={() => onChange(l.value)}
          className={`px-3 py-1.5 rounded text-xs text-left transition-colors flex items-center gap-2 ${
            value === l.value
              ? "bg-blue-500 text-white"
              : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
          }`}
        >
          <span className="font-medium w-12">{l.label}</span>
          <span className="font-mono text-[10px] opacity-70">{l.diagram}</span>
        </button>
      ))}
    </div>
  );
}
