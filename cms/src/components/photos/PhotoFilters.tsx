import { usePhotoStore } from "../../stores/photo-store";

export default function PhotoFilters() {
  const { filters, setFilter, clearFilters, rolls, films, cameras } =
    usePhotoStore();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.roll}
        onChange={(e) => setFilter("roll", e.target.value)}
        className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-sm text-zinc-700 focus:outline-none focus:border-blue-400"
      >
        <option value="">All rolls</option>
        {rolls.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id}
          </option>
        ))}
      </select>

      <select
        value={filters.film}
        onChange={(e) => setFilter("film", e.target.value)}
        className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-sm text-zinc-700 focus:outline-none focus:border-blue-400"
      >
        <option value="">All films</option>
        {films.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <select
        value={filters.camera}
        onChange={(e) => setFilter("camera", e.target.value)}
        className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-sm text-zinc-700 focus:outline-none focus:border-blue-400"
      >
        <option value="">All cameras</option>
        {cameras.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.unused}
          onChange={(e) => setFilter("unused", e.target.checked)}
          className="rounded border-zinc-300 text-blue-500 focus:ring-blue-400/30"
        />
        Unused only
      </label>

      <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.showHidden}
          onChange={(e) => setFilter("showHidden", e.target.checked)}
          className="rounded border-zinc-300 text-amber-500 focus:ring-amber-400/30"
        />
        Show hidden
      </label>

      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilter("search", e.target.value)}
        placeholder="Search alt text, labels..."
        className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-blue-400 w-52"
      />

      {(filters.roll ||
        filters.film ||
        filters.camera ||
        filters.unused ||
        filters.search ||
        filters.showHidden) && (
        <button
          onClick={clearFilters}
          className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
