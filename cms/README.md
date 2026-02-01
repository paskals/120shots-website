# Photo Essay CMS

A local-only content management tool for creating and editing photo essays. Runs as a separate Vite + React app that reads and writes the same YAML content files used by the Astro site.

## Quick Start

From the repo root:

```sh
yarn cms
```

This starts the CMS at [http://localhost:4444](http://localhost:4444).

The CMS reads content directly from `../src/content/` (films, rolls, photo essays) and writes back to the same files, so changes are immediately available to the Astro dev server.

## Features

### Photo Browser

Browse all photos across all film rolls in a single view.

- Photos grouped by year and month with sticky headers
- Filter by roll, film stock, camera, or search text
- "Unused only" toggle to find photos not yet in any essay
- Usage indicators (green = unused, amber = used in essays)
- Roll ID and sequence number overlay on each photo
- Click any photo for full metadata detail (labels, location, linked essays)

### Essay List

Overview of all existing photo essays, sorted newest first. Each card shows cover image, title, date, spread count, and tags.

### Essay Editor

Two-panel layout for composing essays:

**Left panel (Photo Sidebar):**
- Shows photos from the essay's referenced rolls
- "All photos" toggle to browse the entire library
- Search within the sidebar
- Drag photos into spread slots

**Right panel (Spread Editor):**
- Vertical list of spreads, each with a layout type and photo slots
- Drag-and-drop to reorder spreads (grab handle)
- Drag photos between slots (move/swap)
- Drag photos from sidebar into empty slots
- Click layout badge to change spread type via visual picker
- Inline caption editing per spread
- Roll ID and sequence number overlay on each photo
- Delete spreads (with confirmation when photos are present)

**Layout types:**
| Layout | Photos | Description |
|--------|--------|-------------|
| `single` | 1 | Full-width single photo |
| `duo` | 2 | Two photos, equal width |
| `duo-h` | 2 | Two photos, equal width (alias) |
| `duo-l` | 2 | Left photo emphasized (wider) |
| `duo-r` | 2 | Right photo emphasized (wider) |
| `trio` | 3 | Three photos in a row |
| `trio-l` | 3 | Left photo emphasized, two stacked right |
| `trio-r` | 3 | Two stacked left, right photo emphasized |

When switching to a layout with fewer slots, overflow photos are automatically inserted as new single spreads below.

**Metadata panel (toggle via header button):**
- Title, description, publish date, author
- Tags, rolls, film stocks (comma-separated)
- Cover photo picker showing all photos in the essay

**Persistence:**
- Save button + Ctrl/Cmd+S keyboard shortcut
- Dirty state tracking with unsaved changes warning on page leave
- Title required validation (cannot save without a title)
- YAML output matches existing content format exactly
- `.bak` backup created before each save

### New Essay Flow

1. Enter a title (defaults to `Draft YYYY-MM-DD`)
2. Browse and click photos to select them
3. Click "Create Essay" to auto-arrange into spreads (single/duo/trio cycle)
4. Opens in the Essay Editor for refinement

## Architecture

### Single-Process Design

The CMS runs as a single Vite dev server process. The API layer runs as a Vite middleware plugin, so there's no separate backend, no CORS configuration, and no additional ports.

### Tech Stack

| Component | Library |
|-----------|---------|
| Build/Dev | Vite 6 |
| UI | React 19 |
| Styling | TailwindCSS 4 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| State | Zustand 5 |
| Routing | React Router 7 |
| YAML | yaml 2.x |

### Project Structure

```
cms/
  package.json
  vite.config.ts          # Vite config with API middleware plugin
  index.html
  src/
    main.tsx              # React entry point
    App.tsx               # Routes
    index.css             # Tailwind import
    api/
      middleware.ts       # Vite plugin intercepting /api/* requests
      content-loader.ts   # Reads & indexes all YAML content
      content-writer.ts   # Writes YAML with correct formatting
      routes.ts           # REST endpoint handlers
    types/
      index.ts            # TypeScript interfaces mirroring Zod schemas
    stores/
      photo-store.ts      # Photos, rolls, films, filters, selection
      essay-store.ts      # Essay CRUD, spread/photo operations
    pages/
      PhotoBrowserPage.tsx
      EssayListPage.tsx
      EssayEditorPage.tsx
      NewEssayPage.tsx
    components/
      layout/
        AppShell.tsx
      photos/
        PhotoBrowser.tsx
        PhotoCard.tsx
        PhotoFilters.tsx
        PhotoDetail.tsx
      essays/
        EssayList.tsx
        EssayEditor.tsx
        EssayMetaEditor.tsx
        SpreadEditor.tsx
        LayoutPicker.tsx
        PhotoSlot.tsx
        PhotoSidebar.tsx
```

### API Endpoints

All routes are served by the Vite middleware at `/api/*`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/photos` | All photos with optional filters (`?roll=`, `?film=`, `?camera=`, `?unused=true`, `?search=`) |
| GET | `/api/rolls` | All rolls with metadata |
| GET | `/api/films` | All film stocks |
| GET | `/api/cameras` | All unique cameras |
| GET | `/api/essays` | Essay summaries (lightweight, for list view) |
| GET | `/api/essays/:id` | Full essay with spreads |
| POST | `/api/essays` | Create new essay |
| PUT | `/api/essays/:id` | Update existing essay |
| GET | `/api/usage` | Photo-to-essay usage map |
| POST | `/api/reload` | Force re-read content from disk |

### Content Loader

`ContentLoader` reads all YAML from `../src/content/` on startup and builds in-memory indexes:

- **films**: from `films/*.yaml`
- **rolls**: from `rolls/{YEAR}/*.yaml`, ID derived from `manualId` field
- **essays**: from `photoessays/*.yaml`
- **photoUsage**: built by scanning all essay spreads (`photoSrc -> essayId[]`)

### Content Writer

`ContentWriter` generates YAML matching the existing format exactly:

- Uses `yaml.stringify()` with specific options (indent 2, no line wrapping, plain strings)
- Adds blank lines between spread array items (matching existing style)
- Enforces key ordering: title, description, pubDate, author, rolls, filmStocks, tags, cover, spreads
- Creates `.bak` backup before overwriting

### Drag & Drop

Three interaction types in a single `DndContext`:

1. **Sidebar photo to slot**: `useDraggable` on sidebar thumbnails, `useDroppable` on spread slots
2. **Slot to slot** (move/swap): Filled slots are both draggable and droppable
3. **Spread reorder**: `@dnd-kit/sortable` with vertical list strategy, restricted to drag handle

## Relation to Astro Site

The CMS has zero impact on the Astro production build:

- Separate `package.json` and `node_modules`
- Not referenced by any Astro config or build step
- Reads/writes the same `src/content/` YAML files that Astro uses
- `yarn build` for the main site works independently
