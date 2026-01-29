# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)

## Key Components

### Photo Essay Components

- **EssaySpread.astro** - Renders individual spreads within a photo essay with various layouts (single, duo, trio, trio-l, trio-r)
- **EssayProgress.astro** - Circular progress indicator showing current position in essay

### Gallery Components

- **FilmStrip.astro** - Displays film roll thumbnails in a horizontal strip
- **Masonry.astro** - Image gallery layout using CSS masonry grid, references [masonry.css](styles/MasonryLayout.css) and [glightbox.js](scripts/lightbox.js) for lightbox functionality

### Layout Components

- **Header.astro** - Site header containing [Hamburger.astro](components/Hamburger.astro), [ThemeIcon.astro](components/ThemeIcon.astro), [Navigation.astro](components/Navigation.astro), and [Pagefind.astro](components/Pagefind.astro)
- **Footer.astro** - Site footer with social media icons via [astro-icon](../package.json)
- **Homepage.astro** - Used in [index.astro](pages/index.astro), references [homepage.js](scripts/homePage.js) for randomized image display

### Utility Components

- **Pagefind.astro** - Search functionality using [Pagefind](https://pagefind.app/) integration
- **ThemeIcon.astro** - Light/dark mode toggle, references [themetoggle.js](scripts/themetoggle.js)
- **getRandomImage.astro** - Randomizes images from [Content Collections](content/)
- **sortbydate.jsx** - Orders content by date for listing pages

### Typography Components

- **Prose.astro** - [TailwindCSS](../tailwind.config.mjs) typography layout used throughout the site
- **Prose_headings.astro** - Heading formatting
