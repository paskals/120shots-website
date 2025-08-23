# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

120 Shots is a photography portfolio/blog built with Astro.js focusing on film photography. The site features blog posts, film roll galleries, and organized content around different film stocks and photography equipment.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run postbuild` - Run after build to generate search index with Pagefind
- `npm run preview` - Preview built site locally
- `npm run lint` - Format code with Prettier

### Content Creation Scripts

- `npm run create-post -- -p /path/to/photos -d upload-dir -t "Post Title" -m 2000` - Create new blog post from photo folder
- `npm run create-roll -- -p /path/to/photos -n ROLL-NAME -f film-stock -c "Camera Used"` - Create new film roll from photos
- `npm run create-roll-post -- -r "ROLL1,ROLL2" -t "Post Title"` - Create post from existing film rolls

## Architecture

### Content Collections

The site uses Astro's content collections system with strongly typed schemas:

- **posts** (`src/content/posts/`) - Blog posts with MDX content, can reference films and rolls
- **rolls** (`src/content/rolls/`) - Film roll data as YAML files with shot sequences and metadata
- **films** (`src/content/films/`) - Film stock information (brand, ISO, color type)
- **authors** (`src/content/authors/`) - Author profiles with MDX content

All collections are defined in `src/content/config.ts` with Zod schemas for type safety.

### Page Structure

- Dynamic routes use Astro's file-based routing with `[...slug].astro` patterns
- Main page types: posts, rolls, films, authors, tags
- Each content type has both individual pages and index/listing pages

### Asset Management

- Photos are hosted on CloudFlare R2 bucket, not in the repo
- Images are referenced by URL in content files
- The `photer.ts` utility handles photo processing and upload workflows

### Key Components

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

Requires `.env` file with CloudFlare R2 credentials:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
BUCKET_NAME=
BUCKET_PUBLIC_URL=
TOP_LEVEL_DIR=images/
```

### Build Process

Always run `npm run build && npm run postbuild` for full production build. The postbuild step generates the search index required for Pagefind functionality.

### Content Workflows

The utility scripts in `src/utils/` handle the complete workflow from raw photos to published content, including image processing, CloudFlare R2 upload, and content file generation.

### Deployment

Built as static site for CloudFlare Pages deployment. Site configuration in `astro.config.mjs` sets output to "static" and site URL to "<https://120shots.com>".
