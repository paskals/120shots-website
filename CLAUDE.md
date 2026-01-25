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

### Content Creation Scripts

- `yarn create-essay -p /path/to/photos -d upload-dir -t "Essay Title" -m 2000` - Create new essay from photo folder
- `yarn create-roll -p /path/to/photos -n ROLL-NAME -f film-stock -c "Camera Used"` - Create new film roll from photos (auto-generates image descriptions via Vision API)
- `yarn create-roll-essay -r "ROLL1,ROLL2" -t "Essay Title"` - Create essay from existing film rolls

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

- **EssaySpread.astro** - Renders photo essay spreads with various layouts (single, duo, trio, trio-l, trio-r)
- **Masonry.astro** - Image gallery layout using CSS masonry
- **FilmStrip.astro** - Displays film roll thumbnails
- **Header.astro/Footer.astro** - Site navigation and layout
- **Pagefind.astro** - Search functionality (works only after build)

### Styling & UI

- TailwindCSS for styling
- Custom CSS in `src/styles/global.css` and `src/styles/glightbox.css`
- GLightbox for image lightbox functionality
- Dark/light theme toggle support

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

### Content Workflows

The utility scripts in `src/utils/` handle the complete workflow from raw photos to published content, including image processing, CloudFlare R2 upload, and content file generation.

### Deployment

Built as static site for CloudFlare Pages deployment. Site configuration in `astro.config.mjs` sets output to "static" and site URL to "<https://120shots.com>".
