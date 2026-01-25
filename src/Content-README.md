# Astro Content Collections

### Refer to [Astro docs on Content Collections](https://docs.astro.build/en/guides/content-collections/)

Content collections are defined in [config.ts](content/config.ts) with Zod schemas. Props can be passed to [Astro components](https://docs.astro.build/en/guides/content-collections/#passing-content-as-props) for rendering.

## Collections

### Photo Essays (`/photoessays`)
YAML files defining visual stories with spreads. Each essay contains:
- Metadata (title, description, pubDate, author)
- References to rolls and film stocks
- Cover image
- Spreads array with layout configurations (single, duo, trio, trio-l, trio-r)

### Rolls (`/rolls`)
YAML files containing film roll data:
- Roll identifier and metadata (camera, film, format)
- Shots array with image URLs, alt text, and EXIF data
- Cover shot reference

### Films (`/films`)
YAML files defining film stock information:
- Brand, name, ISO
- Color type (color negative, black & white, slide)

### Authors (`/authors`)
MDX files with author profiles and bio content.
