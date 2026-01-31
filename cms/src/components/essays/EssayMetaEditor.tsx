import { useEssayStore } from "../../stores/essay-store";

export default function EssayMetaEditor() {
  const { current, updateMeta } = useEssayStore();
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Title</label>
        <input
          type="text"
          value={current.title}
          onChange={(e) => updateMeta({ title: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Description</label>
        <textarea
          value={current.description}
          onChange={(e) => updateMeta({ description: e.target.value })}
          rows={2}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Publish Date
          </label>
          <input
            type="date"
            value={current.pubDate}
            onChange={(e) => updateMeta({ pubDate: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Author</label>
          <input
            type="text"
            value={current.author}
            onChange={(e) => updateMeta({ author: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={current.tags?.join(", ") || ""}
          onChange={(e) =>
            updateMeta({
              tags: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Rolls (comma-separated IDs)
        </label>
        <input
          type="text"
          value={current.rolls?.join(", ") || ""}
          onChange={(e) =>
            updateMeta({
              rolls: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Film Stocks (comma-separated IDs)
        </label>
        <input
          type="text"
          value={current.filmStocks?.join(", ") || ""}
          onChange={(e) =>
            updateMeta({
              filmStocks: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
        />
      </div>
    </div>
  );
}
