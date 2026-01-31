import type { SpreadLayout } from "../../types";

interface Props {
  value: SpreadLayout;
  onChange: (layout: SpreadLayout) => void;
}

const LAYOUTS: { value: SpreadLayout; label: string; diagram: string }[] = [
  { value: "single", label: "Single", diagram: "[ ════════ ]" },
  { value: "duo", label: "Duo", diagram: "[ ════ | ════ ]" },
  { value: "duo-l", label: "Duo L", diagram: "[ ══════ | ════ ]" },
  { value: "duo-r", label: "Duo R", diagram: "[ ════ | ══════ ]" },
  { value: "trio", label: "Trio", diagram: "[ ═══ | ═══ | ═══ ]" },
  { value: "trio-l", label: "Trio L", diagram: "[ ══════ | ═:═ ]" },
  { value: "trio-r", label: "Trio R", diagram: "[ ═:═ | ══════ ]" },
];

export default function LayoutPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {LAYOUTS.map((l) => (
        <button
          key={l.value}
          onClick={() => onChange(l.value)}
          className={`px-2 py-1.5 rounded text-[10px] font-mono text-center transition-colors ${
            value === l.value
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
          }`}
          title={l.diagram}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
