# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

120 Shots is a photography portfolio built with Astro.js focusing on film photography. The site features photo essays, film roll galleries, and organized content around different film stocks and photography equipment.

## Development Commands

### Core Development

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn postbuild` - Run after build to generate search index with Pagefind
- `yarn preview` - Preview built site locally
- `yarn lint` - Format code with Prettier

### CMS

- `yarn cms` - Start the photo essay CMS at localhost:4444 (Vite + React app in `cms/`)

### Content Creation Scripts

- `yarn create-essay -p /path/to/photos -d upload-dir -t "Essay Title" -m 2000` - Create new essay from photo folder
- `yarn create-roll -p /path/to/photos -n ROLL-NAME -f film-stock -c "Camera Used"` - Create new film roll from photos (auto-generates image descriptions via Vision API)
- `yarn create-roll-essay -r "ROLL1,ROLL2" -t "Essay Title"` - Create essay from existing film rolls
- `yarn reformat -f path/to/file.yaml` - Reformat an existing roll or essay YAML file with consistent formatting

Note: `create-roll` uses Google Vision API by default to generate meaningful alt text descriptions. Use `--skipVision` flag to disable this.

## Architecture

### Content Collections

The site uses Astro's content collections system with strongly typed schemas:

- **photoessays** (`src/content/photoessays/`) - Photo essays as YAML files with spreads layout, can reference films and rolls
- **rolls** (`src/content/rolls/`) - Film roll data as YAML files with shot sequences and metadata
- **films** (`src/content/films/`) - Film stock information (brand, ISO, color type)
- **authors** (`src/content/authors/`) - Author profiles with MDX content

All collections are defined in `src/content/config.ts` with Zod schemas for type safety.

### Page Structure

- Dynamic routes use Astro's file-based routing with `[...slug].astro` patterns
- Main page types: essays, rolls, films, authors, tags
- Each content type has both individual pages and index/listing pages

### Asset Management

- Photos are hosted on CloudFlare R2 bucket, not in the repo
- Images are referenced by URL in content files
- The `photer.ts` utility handles photo processing and upload workflows

### Key Components

- **PhotoSpread.astro** - Renders photo essay spreads with various layouts:
  - `single`: one photo
  - `duo`: two photos side by side (equal width)
  - `duo-h`: two photos stacked vertically (experimental, still in development)
  - `duo-l`: two photos with left emphasized (wider)
  - `duo-r`: two photos with right emphasized (wider)
  - `trio`: three photos in a row
  - `trio-l`: photo 1 main on left, photos 2,3 stacked on right
  - `trio-r`: photos 1,2 stacked on left, photo 3 main on right
- **Masonry.astro** - Image gallery layout using CSS masonry
- **FilmStrip.astro** - Displays film roll thumbnails
- **Header.astro/Footer.astro** - Site navigation and layout
- **Pagefind.astro** - Search functionality (works only after build)

### Styling & UI

- TailwindCSS for styling
- Custom CSS in `src/styles/global.css` and `src/styles/glightbox.css`
- GLightbox for image lightbox functionality
- Dark/light theme toggle support

## Git Workflow

This section overrides the global git workflow where they differ.

### Code changes

Work as usual. Branch off `develop` (`feat/`, `fix/`, `chore/`, ...), open a PR into `develop`, and
release with a `develop` → `main` PR.

### Content changes

Content is photo essays, rolls and other content YAML. It lives on the `content` branch, the draft
branch. When the user asks for a content change:

1. **Start from the latest `content`.** Run `git fetch`, switch to `content` and fast-forward it to
   `origin/content`. If `origin/main` has commits that `content` lacks, merge `main` into `content`
   first.
2. **Commit on `content` and push it when the work is done.** No feature branch and no PR. Pushing to
   `content` does not publish anything.
3. **Publish only when the user asks.** Publishing means merging `content` into `main` with a merge
   commit (`git merge --no-ff content`) and pushing `main`. No PR. The site deploys from `main`.
4. Never commit content directly to `main` or `develop`.

### Keeping `content` and `develop` current

Everything that lands on `main` flows back. The `Sync branches` workflow
(`.github/workflows/sync-branches.yml`) merges `main` into both `content` and `develop` on every push
to `main`: a release, a publication or a Release Please commit. Each branch fast-forwards when it can
and gets a merge commit otherwise. If a merge conflicts, that branch's job fails and the branch needs
a manual merge of `main`.

### Releases

Releases are automated with Release Please (`.github/workflows/release-please.yml`). On every push to
`main` it keeps a release PR open that lists the releasable commits since the last release tag. Merging
that PR bumps `package.json`, updates `CHANGELOG.md` and publishes the GitHub release. The release PR is
the user's to merge.

- **Only code changes release.** Commits that touch only `src/content` are ignored
  (`exclude-paths` in `release-please-config.json`), so publishing content never creates a release.
- **Write code commits as Conventional Commits.** PRs merge with merge commits, so every commit message on
  the branch counts; the PR title does not.
  - `fix: ...` makes a patch release.
  - `feat: ...` makes a minor release.
  - `feat!: ...` or a `BREAKING CHANGE:` footer makes a major release.
  - `chore:`, `docs:`, `ci:`, `refactor:` and `test:` do not make a release.
- Content commits need no prefix.
- Dependabot commits (`.github/dependabot.yml`) use `fix(deps)` for runtime dependencies and
  `chore(deps-dev)` for dev dependencies. Runtime bumps, security fixes included, make a patch release;
  dev-only bumps do not.

## Important Technical Details

### Environment Setup

Requires `.env` file with CloudFlare R2 credentials and optional Google API key:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
BUCKET_NAME=
BUCKET_PUBLIC_URL=
TOP_LEVEL_DIR=images/
GOOGLE_API_KEY=  # Optional: for Vision API image descriptions
```

### Build Process

Always run `yarn build && yarn postbuild` for full production build. The postbuild step generates the search index required for Pagefind functionality.

### Photo Essay CMS (`cms/`)

A separate Vite + React SPA for visual essay editing. Runs on port 4444 with API middleware (no separate backend). Key details:

- **Stack**: Vite 6, React 19, TailwindCSS 4, @dnd-kit, Zustand 5, React Router 7
- **API**: Runs as Vite middleware plugin in `cms/src/api/`. ContentLoader reads all YAML into memory, ContentWriter produces format-matching YAML.
- **State**: Zustand stores in `cms/src/stores/` — `photo-store.ts` (photos, filters, selection) and `essay-store.ts` (essay CRUD, spread/photo operations)
- **Pages**: PhotoBrowser, EssayList, EssayEditor (two-panel DnD), NewEssay (multi-select + auto-arrange)
- **DnD**: Three types in one DndContext — sidebar-photo-to-slot, slot-to-slot swap, spread reorder
- **YAML fidelity**: Ports `formatYamlWithSpacing()` from `src/utils/utils.ts` to match existing content format exactly
- Has zero impact on Astro build (separate `package.json`, not referenced by Astro)
- Can only be used for creating and editing Essays, not for uploading photos (creating rolls)

### Content Workflows

The utility scripts in `src/utils/` handle the complete workflow from raw photos to published content, including image processing, CloudFlare R2 upload, and content file generation.

### Deployment

Built as static site for CloudFlare Pages deployment. Site configuration in `astro.config.mjs` sets output to "static" and site URL to "<https://120shots.com>".
