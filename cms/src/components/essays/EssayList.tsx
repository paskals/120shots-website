import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEssayStore } from "../../stores/essay-store";

export default function EssayList() {
  const { essays, loading } = useEssayStore();

  const sorted = useMemo(
    () => [...essays].sort((a, b) => b.pubDate.localeCompare(a.pubDate)),
    [essays]
  );

  if (loading && essays.length === 0) {
    return <div className="text-zinc-400 text-sm">Loading essays...</div>;
  }

  if (essays.length === 0) {
    return <div className="text-zinc-400 text-sm">No essays found.</div>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {sorted.map((essay) => (
        <Link
          key={essay.id}
          to={`/essays/${essay.id}`}
          className="group block rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-colors bg-white shadow-sm hover:shadow"
        >
          {essay.cover?.src && (
            <div className="aspect-[16/9] bg-zinc-100">
              <img
                src={essay.cover.src}
                alt={essay.cover.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-3">
            <h3 className="font-medium text-sm text-zinc-800 group-hover:text-zinc-900 transition-colors">
              {essay.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">{essay.pubDate}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500">
                {essay.spreadCount} spreads
              </span>
              {essay.rolls && (
                <span className="text-xs text-zinc-500">
                  {essay.rolls.length} roll(s)
                </span>
              )}
            </div>
            {essay.tags && essay.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {essay.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[10px] bg-zinc-100 text-zinc-500 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
