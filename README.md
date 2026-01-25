<h1 align="center">120 Shots</h1>

> Photography Portfolio/Blog

### Template based on: [revista-3](https://github.com/erfianugrah/revista-3)

### Published version: [120shots.com](https://120shots.com)

## Create your own astro project using this repo as a template

```sh
npm create astro@latest -- --template paskals/120shots-website
```

OR clone this repo.

After creating your site with this template:

- Delete all blog posts from [/src/content/posts](/src/content/posts)
  - Create your own posts under this folder.
- Delete all film rolls from [/src/content/posts](/src/content/rolls)
- Create your own author profile under [/src/content/authors](/src/content/authors) and delete mine.
- Adjust the site URL in [astro.config.mjs](/astro.config.mjs).
- Adjust site metadata, favicon in [/src/layouts/BaseLayout.astro](/src/layouts/BaseLayout.astro).
- Create your own R2 CloudFlare bucket and create an `.env.` file.

## Introduction

- Text content is "hosted" in the repo in the form of markdown files. Deployment is done (for free) with [CloudFlare pages](https://pages.cloudflare.com).
- Photos are hosted separately and are only referenced via URLs in the markdown blog posts. There's a script to help you process and upload photos to a [CloudFlare R2 bucket](https://developers.cloudflare.com/r2/) - see [Utility Scripts](#utility-scripts).

## Install (to use this repo directly)

```sh
yarn install
```

## Development Server

```sh
yarn dev
```

## Lint

```sh
yarn lint
```

## Build for deployment

```sh
yarn build && yarn postbuild
```

If you want to preview the built site, use `yarn preview` after building. The pagefind search functionality only works after building (not with the dev server).

## External Usage

Build and deploy as a static page on [cloudflare pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).

<h2 id="utility-scripts">Utility Scripts</h3>

### Create a draft post from a folder with photos

This script creates a new post under `/src/content/posts`. By default the name of the file starts with today's date. The script uploads a folder of photos to a CloudFlare R2 bucket. The post will contain a randomly chosen header image and a masonry component with the URLs of all of the uploaded images.
You can specify the max dimension fo the photos. The photos are converted to `.webp` format and then uploaded to the R2 bucket.

```sh
yarn create-post -p /dir/with/photos -d upload-sub-dir -t "Post Title" -m 2000 -r "File Name Prefix" --randomSuffix
```

- `-p` - Photos source directory (not recursive).
- `-d` - Name of sub-directory in the R2 bucket. This is where the files will be uploaded under the top-level directory of your R2 bucket.
- `-t` - Post tile.
- `-m` - Max dimension of photos. This will resize photos such that whatever the bigger dimmension is (width or height) it will not be bigger than this number (2000px is the default).
- `--renameFiles` or `-r` - Renames files with the specified prefix, and adds a sequential numbering as a suffix (starting at "000").
- `--randomSuffix` or `-s` - Adds a random suffix to all uploaded filenames to prevent overwriting files with the same original file name.

### Create a film roll from a folder with photos

This script creates a new roll under `/src/content/rolls`. The rolls content library is made of YAML files with information about each roll, including URLs to all images.

```sh
yarn create-roll -p /dir/with/photos -n ROLL-NAME -f film-stock -c "Camera Used" -rs
```

- `-p` - Photos source directory (not recursive).
- `-n` - Name of the film roll. Will also be used as the sub-directory in the upload destination..
- `-f` - Film stock used. Must match an entry from the films content library.
- `-m` - Max dimension of photos. This will resize photos such that whatever the bigger dimmension is (width or height) it will not be bigger than this number (2000px is the default).
- `--renameFiles` or `-r` - If not specified, the original file names will be kept. When specified, the roll name (n) will be used as the file name prefix, after which a numeric sequence number will be added. If a random suffix is also specified, it will be added after the sequence number.
- `--randomSuffix` or `-s` - Adds a random suffix to all uploaded filenames to prevent overwriting files with the same original file name.

This script assumes that photos have their exif date/time information updated. Dates will be taken from the exif and stored in the film roll YAML data file.

### Create a draft post from existing film rolls

This script takes film rolls from the rolls content library and creates a draft post containing all photos in one masonry component per roll.

```sh
yarn create-roll-post -r "ROLL-NAME1,ROLL-NAME2" -t "Post Title"
```

- `-r` - Comma separated list of roll IDs to include in the post.
- `-t` - Title of the created post.

### Interactive Claude Command

For a more user-friendly experience, you can use the `/photo` Claude slash command which provides an interactive interface for all the above workflows:

```
/photo
```

This command will:

- Guide you through creating film rolls, blog posts, or posts from existing rolls
- Validate film types against your content library
- Show available rolls from your R2 bucket
- Offer to create blog posts after roll creation
- Use smart defaults (author, image dimensions, etc.)

You can also skip directly to specific workflows:

- `/photo roll` - Create a film roll
- `/photo post` - Create a blog post from photos
- `/photo rollpost` - Create a blog post from existing rolls

### Generate image descriptions using Google Vision API

This utility generates meaningful alt text descriptions for your photography using Google Vision API. It focuses on landmarks and visual elements, filtering out generic photography terms to create descriptions suitable for accessibility and SEO.

```sh
yarn describe-images "https://cdn.120shots.com/images/roll/photo.webp"
```

Options:

- `--detailLevel` or `-d` - Description detail level: `basic`, `detailed`, `comprehensive` (default: detailed)
- `--delay` - Delay between API calls in milliseconds (default: 100ms)

Examples:

```sh
# Single image with default (detailed) level
yarn describe-images "https://cdn.120shots.com/images/EHV-01/photo.webp"

# Multiple images
yarn describe-images "photo1.webp" "photo2.webp" "photo3.webp"

# Basic descriptions (fewer terms)
yarn describe-images --detailLevel basic "photo.webp"

# Comprehensive descriptions (more terms + landmarks)
yarn describe-images --detailLevel comprehensive "photo.webp"

# Custom delay for rate limiting
yarn describe-images --delay 200 "photo1.webp" "photo2.webp"
```

**Requirements:** Add `GOOGLE_API_KEY=your_google_cloud_api_key` to your `.env` file and enable the Cloud Vision API in your Google Cloud Console.

### Get R2 bucket statistics

This command provides comprehensive statistics about your CloudFlare R2 bucket, including folder breakdowns, file type analysis, and storage usage.

```sh
yarn r2-stats
```

Options:

- `--detailed` or `-d` - Show detailed breakdown by folders and file types
- `--prefix` or `-p` - Filter objects by prefix (folder path)
- `--json` or `-j` - Output as JSON for programmatic use
- `--limit` or `-l` - Maximum number of objects to process (0 = no limit)

Examples:

```sh
# Basic bucket statistics
yarn r2-stats

# Detailed breakdown
yarn r2-stats --detailed

# Statistics for specific folder
yarn r2-stats --prefix images/GEL-01/

# JSON output for scripts
yarn r2-stats --json

# Limit processing to first 100 objects
yarn r2-stats --limit 100
```

### R2 Bucket configuration

- Create a .env file under the root directory and include the following content:

```env
R2_ACCOUNT_ID=your account ID
R2_ACCESS_KEY_ID=your access key
R2_SECRET_ACCESS_KEY=your secret access key
BUCKET_NAME=name of your bucket
BUCKET_PUBLIC_URL=public URL of your bucket
TOP_LEVEL_DIR=images/
GOOGLE_API_KEY=your google cloud api key
```

## How it all works

- [Components readme](src/Components-README.md)
- [Layouts readme](src/Layouts-README.md)
- [Pages readme](src/Pages-README.md)
- [Content readme](src/Content-README.md)

## Show your support

Give a ⭐️ if this project helped you!
