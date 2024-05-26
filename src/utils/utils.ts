import fs from "fs";
import sanitize from "sanitize-filename";
import path from "path";
import sharp, { type OutputInfo } from "sharp";
import exif from "exif-reader";
import PrettyYAML from "json-to-pretty-yaml";
import { parse } from 'yaml'

export const TEMP_FOLDER = "./tmp";

export const getRandomString = (length?: number) => {
  return Math.ceil(Math.random() * 10 ** 9)
    .toString(16)
    .slice(-(length || 6))
    .toUpperCase();
};

export const slugify = (text: string) => {
  return sanitize(text).toLowerCase().trim().replace(/[\s+,]/g, "-");
};

export const getSourceFiles = (sourcePath: string) => {
  // Get all files from the specified sourcePath
  const files = fs.readdirSync(sourcePath, { withFileTypes: true });

  return files;
};

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
};

const saveFile = (filePath: string, textContent: string) => {
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    throw new Error("File already exists: " + filePath);
  } else {
    // If not, check if directory exists, if not create it
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
  }

  return fs.promises.writeFile(filePath, textContent).then(() => filePath);
};

interface FileProcessOptions {
  tempDestination: string;
  maxDimensionSize: number;
  renameFiles?: string;
  randomSuffix?: string;
  quality?: number;
}

interface FileProcessResult {
  sharpInfo: sharp.OutputInfo;
  filePath: string;
  sequence: string;
  metadata: sharp.Metadata;
}
/**
 *
 * @param files
 * @param options
 * @returns
 */
export const processFiles = async (
  files: fs.Dirent[],
  options: FileProcessOptions,
) => {
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

    const sequence = i.toString().padStart(3, "0");

    if (options.renameFiles !== undefined) {
      fileName = sanitize(options.renameFiles)
        .concat("-", sequence)
        .replace(/\s+/g, "_");
    } else {
      fileName = file.name.split(".")[0].replace(/\s+/g, "_");
    }

    if (options.randomSuffix) {
      fileName = fileName.concat("-", getRandomString());
    }
    const filePath = path.join(options.tempDestination, `${fileName}.webp`);
    // newFiles.push(filePath);

    const metadata = await sharp(path.join(file.path, file.name)).metadata();

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
          resolve({ sharpInfo, filePath, sequence, metadata });
        });
    });

    promises.push(prom);
    // paths.push(filePath);
  }
  return Promise.all(promises);
};

export const deleteTempFiles = (newFiles: string[]) => {
  newFiles.forEach((file) => {
    fs.rmSync(file);
  });
};

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
import Masonry from "../../components/Masonry.astro";
import FilmStrip from "../../components/FilmStrip.astro";

> Post content goes here

<Masonry
  columns='3'
  images={
    [
      ${imageURLs.map((url, index) => `{ src: "${url}", alt: "${title} ${index}" }`).join(`,\n      `)}
    ]
  }
/>`;

  return saveFile(filePath, textContent);
};

interface FilmRollObject {
  slug: string;
  film: string;
  camera: string;
  format: string;
  description?: string;
  shots: {
    sequence: string;
    date?: string;
    offsetTime?: string;
    hidden?: boolean;
    image: {
      src: string;
      alt: string;
      positionx?: string;
      positiony?: string;
    };
  }[];
}

export const createNewRoll = async (options: {
  shots: {
    url: string;
    fileInfo: FileProcessResult;
  }[];
  rollName: string;
  film: string;
  camera: string;
  format: string;
  description?: string;
}) => {
  const { shots, rollName, film, camera, format, description } = options;

  let roll: FilmRollObject = {
    slug: slugify(rollName).toUpperCase(),
    film,
    camera,
    format,
    description,
    shots: [],
  };

  for (let index = 0; index < shots.length; index++) {
    const fileInfo = shots[index].fileInfo;
    const fileExif = fileInfo.metadata.exif
      ? exif(fileInfo.metadata.exif)
      : undefined;

    roll.shots.push({
      sequence: fileInfo.sequence,
      date: fileExif?.Photo?.DateTimeOriginal?.toISOString(),
      offsetTime: fileExif?.Photo?.OffsetTime,
      hidden: false,
      image: {
        src: shots[index].url,
        alt: rollName + " " + fileInfo.sequence,
        positionx: "50%",
        positiony: "50%",
      },
    });
  }

  const firstDate = roll.shots[0].date
    ? new Date(roll.shots[0].date)
    : new Date();
  const firstYear = firstDate.getFullYear().toString();

  const fileName = slugify(rollName).toUpperCase() + ".yaml";
  roll.slug = `${firstYear}/${roll.slug}`;
  const filePath = `${path.normalize('./src/content/rolls/' + firstYear)}/${fileName}`;
  const yamlContent = PrettyYAML.stringify(roll);

  return saveFile(filePath, yamlContent);
}

const getRollData = async (rollName: string) => {
  const basePath = path.normalize("./src/content/rolls/");
  let files = fs.readdirSync(basePath, { withFileTypes: true, recursive: true });
  files = files.filter((file) => file.name.endsWith(".yaml"));
  const rollFile = files.find((file) => file.name.toLowerCase().includes(rollName.toLowerCase()));
  return rollFile ? parse(fs.readFileSync(path.join(rollFile.path, rollFile.name), 'utf8')) as FilmRollObject : undefined;
}

export const createPostFromRolls = async (
  rolls: string[],
  postTitle?: string,
  frontMatterParameters?: {},
) => {

  // Get rolls data from content library
  const rollsData: FilmRollObject[] = [];
  for (const roll of rolls) {
    const rollData = await getRollData(roll);
    if (!rollData) {
      throw new Error("Roll not found: " + roll);
    }
    rollsData.push(rollData);
  }

  if (rollsData.length === 0) {
    throw new Error("No valid rolls found!");
  }

  const now = new Date();
  const title = postTitle || `Draft post: ${rollsData.map((roll) => roll.slug).join(", ")}`;

  const fileName =
    slugify(now.toISOString().split("T")[0] + "-" + title) + ".mdx";
  const filePath = path.normalize("./src/content/posts/") + fileName;

  const randomShot = rollsData[0].shots[Math.floor(Math.random() * rollsData[0].shots.length)]

  const textContent =
    `---
title: "${title}"
slug: ${slugify(title)}
pubDate: ${now.toISOString()}
updatedDate: ${now.toISOString()}
tags: []
rolls: \n  ${rollsData.map((roll) => `- ${roll.slug}`).join("\n  ")}
author: paskal
image:
  {
    src: ${randomShot.image.src},  
    alt: "${title}",
    positionx: ${randomShot.image.positionx},
    positiony: ${randomShot.image.positiony},
  }
description: ""
${frontMatterParameters
      ? Object.entries(frontMatterParameters).map(
        ([key, value]) => `${key}: ${JSON.stringify(value)}\n`,
      )
      : ""
    }
---
import Masonry from "../../components/Masonry.astro";
import FilmStrip from "../../components/FilmStrip.astro";

> Post content goes here

${rollsData.map((roll) => { // Make a new section per roll with a masonry element
      return `## ${roll.slug.toUpperCase()}

  <Masonry
  columns='3'
  images = {
    [
      ${roll.shots
          .filter(shot => !shot.hidden)
          .map((shot) => `{ src: "${shot.image.src}", alt: "${shot.image.alt}" }`).join(`,\n      `)}
    ]
  }
/>`
    }).join("\n\n")
    }`

  return saveFile(filePath, textContent);
};
