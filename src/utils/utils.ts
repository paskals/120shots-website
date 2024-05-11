import fs from "fs";
import sanitize from "sanitize-filename";
import path from "path";
import sharp, { type OutputInfo } from "sharp";
import exif from "exif-reader";

export const TEMP_FOLDER = "./tmp";

export const getRandomString = (length?: number) => {
  return Math.ceil(Math.random() * 10 ** 9)
    .toString(16)
    .slice(-(length || 6))
    .toUpperCase();
};

export const slugify = (text: string) => {
  return sanitize(text).toLowerCase().trim().replace(/\s+/g, "-");
};


export const getSourceFiles = (sourcePath: string) => {
  // Get all files from the specified sourcePath
  const files = fs.readdirSync(sourcePath, { withFileTypes: true });

  return files;
}

export const createTempDir = (destinationDir: string) => {

  let tmpFolder = TEMP_FOLDER;

  // Create TMP folder if it doesn't exist
  if (!fs.existsSync(tmpFolder)) {
    fs.mkdirSync(tmpFolder);
  }
  tmpFolder = path.resolve(tmpFolder);
  // create sub-folder if it doesn't exist
  const tempDestination = path.join(tmpFolder, destinationDir);
  if (!fs.existsSync(tempDestination)) {
    fs.mkdirSync(tempDestination);
  }

  return tempDestination;
}

interface FileProcessOptions {
  tempDestination: string,
  maxDimensionSize: number,
  renameFiles?: string,
  randomSuffix?: string,
  quality?: number
}

interface FileProcessResult {
  sharpInfo: sharp.OutputInfo,
  filePath: string
}
/**
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export const processFiles = async (files: fs.Dirent[], options: FileProcessOptions) => {
  const promises: Promise<FileProcessResult>[] = [];
  // const paths: string[] = [];

  // const newFiles: string[] = [];
  // Loop over each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.isDirectory() || file.name.startsWith(".")) {
      continue;
    }

    let fileName = "";

    if (options.renameFiles !== undefined) {
      fileName = sanitize(options.renameFiles)
        .concat("-", i.toString().padStart(3, "0"))
        .replace(/\s+/g, "_");
    } else {
      fileName = file.name.split(".")[0].replace(/\s+/g, "_");
    }

    if (options.randomSuffix) {
      fileName = fileName.concat("-", getRandomString());
    }
    const filePath = path.join(options.tempDestination, `${fileName}.webp`);
    // newFiles.push(filePath);

    // =========== TMP =========== //TODO: remove
    const metadata = await sharp(path.join(file.path, file.name)).metadata();
    console.info(JSON.stringify(exif(metadata.exif || {
      type: "Buffer",
      data: []
    })));
    // =================
    const prom: Promise<FileProcessResult> = new Promise((resolve) => {
      return sharp(path.join(file.path, file.name))
        .resize({
          width: options.maxDimensionSize,
          height: options.maxDimensionSize,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: options.quality || 80,
          effort: 0,
          smartSubsample: true,
        })
        .toFile(filePath)
        .then((sharpInfo) => {
          resolve({ sharpInfo, filePath })
        })

    })

    promises.push(prom);
    // paths.push(filePath);
  }
  return Promise.all(promises);
}

export const deleteTempFiles = (newFiles: string[]) => {
  newFiles.forEach((file) => {
    fs.rmSync(file);
  });
}

export const createNewPost = (
  imageURLs: string[],
  postTitle?: string,
  frontMatterParameters?: {},
) => {
  const now = new Date();
  const title = postTitle || "Draft post";
  const fileName =
    slugify(now.toISOString().split("T")[0] + "-" + title) + ".mdx";
  const filePath = path.normalize("./src/content/posts/") + fileName;

  const textContent = `---
title: ${title}
slug: ${slugify(title)}
pubDate: ${now.toISOString()}
updatedDate: ${now.toISOString()}
tags: []
author: paskal
image:
  {
    src: ${imageURLs[Math.floor(Math.random() * imageURLs.length)]},
    alt: "${title}",
    positionx: 50%,
    positiony: 50%,
  }
description: ""
${frontMatterParameters
      ? Object.entries(frontMatterParameters).map(
        ([key, value]) => `${key}: ${JSON.stringify(value)}\n`,
      )
      : ""
    }
---
> Post content goes here

import MasonryLayout from "../../components/Masonry.astro";

<MasonryLayout
  images={
    [
      ${imageURLs.map((url, index) => `{ src: "${url}", alt: "${title} ${index}" }`).join(`,\n      `)}
    ]
  }
/>`;

  return fs.promises.writeFile(filePath, textContent).then(() => filePath);
};
