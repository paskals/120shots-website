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
npm install
```

## Development Server

```sh
npm run dev
```

## Lint

```sh
npm run lint
```

## Build for deployment

```sh
npm run build && npm run postbuild
```

If you want to preview the built site, use `npm run preview` after building. The pagefind search functionality only works after building (not with the dev server).

## External Usage

Build and deploy as a static page on [cloudflare pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).

<h2 id="utility-scripts">Utility Scripts</h3>

### Create a draft post from a folder with photos

This script creates a new post under `/src/content/posts`. By default the name of the file starts with today's date. The script uploads a folder of photos to a CloudFlare R2 bucket. The post will contain a randomly chosen header image and a masonry component with the URLs of all of the uploaded images.
You can specify the max dimension fo the photos. The photos are converted to `.webp` format and then uploaded to the R2 bucket.

```sh
npm run create-post -- -p /dir/with/photos -d upload-sub-dir -t "Post Title" -m 2000 -r "File Name Prefix" --randomSuffix
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
npm run create-roll -- -p /dir/with/photos -n ROLL-NAME -f film-stock -c "Camera Used" -rs
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
npm run create-roll-post -- -r "ROLL-NAME1,ROLL-NAME2" -t "Post Title"
```

- `-r` - Comma separated list of roll IDs to include in the post.
- `-t` - Title of the created post.

### R2 Bucket configuration

- Create a .env file under the root directory and include the following content:

```env
R2_ACCOUNT_ID=your account ID
R2_ACCESS_KEY_ID=your access key
R2_SECRET_ACCESS_KEY=your secret access key
BUCKET_NAME=name of your bucket
BUCKET_PUBLIC_URL=public URL of your bucket
TOP_LEVEL_DIR=images/
```

## How it all works

- [Components readme](src/Components-README.md)
- [Layouts readme](src/Layouts-README.md)
- [Pages readme](src/Pages-README.md)
- [Content readme](src/Content-README.md)

## Show your support

Give a ⭐️ if this project helped you!
