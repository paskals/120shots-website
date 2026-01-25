import fs from "fs";
import sanitize from "sanitize-filename";
import path from "path";
import sharp, { type OutputInfo } from "sharp";
import exif from "exif-reader";
import { parse, stringify } from "yaml";

export const TEMP_FOLDER = "./tmp";

export const getRandomString = (length?: number) => {
  return Math.ceil(Math.random() * 10 ** 9)
    .toString(16)
    .slice(-(length || 6))
    .toUpperCase();
};

export const slugify = (text: string) => {
  return sanitize(text)
    .toLowerCase()
    .trim()
    .replace(/[\s+,]/g, "-");
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

/**
 * Adds blank lines between top-level items in specified YAML arrays
 */
function addBlankLinesBetweenArrayItems(
  yamlString: string,
  arrayNames: string[]
): string {
  const lines = yamlString.split('\n');
  const result: string[] = [];
  let currentArray: string | null = null;
  let firstItemInArray = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if entering a target array
    for (const arrayName of arrayNames) {
      if (line === `${arrayName}:`) {
        currentArray = arrayName;
        firstItemInArray = true;
        break;
      }
    }

    // Check if exited array (dedent to root)
    if (currentArray && line.length > 0 && !line.startsWith(' ')) {
      currentArray = null;
    }

    // Add blank line before array items (except first)
    if (currentArray && line.match(/^  - /)) {
      if (!firstItemInArray) {
        result.push('');
      }
      firstItemInArray = false;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Converts object to YAML with custom formatting and spacing
 */
export function formatYamlWithSpacing(
  obj: any,
  arrayNamesToSpace: string[] = []
): string {
  let yamlString = stringify(obj, {
    indent: 2,
    lineWidth: 0,
    minContentWidth: 0,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  });

  if (arrayNamesToSpace.length > 0) {
    yamlString = addBlankLinesBetweenArrayItems(yamlString, arrayNamesToSpace);
  }

  return yamlString;
}

export const createNewEssay = (
  imageURLs: string[],
  essayTitle?: string,
  options?: { rolls?: string[]; filmStocks?: string[]; tags?: string[] },
) => {
  const now = new Date();
  const title = essayTitle || "Draft essay";
  const dateStr = now.toISOString().split("T")[0];
  const fileName = slugify(dateStr + "-" + title) + ".yaml";
  const filePath = path.normalize("./src/content/photoessays/") + fileName;

  // Build spreads - one single-layout spread per image
  const spreads = imageURLs.map((url, index) => ({
    layout: "single",
    photos: [
      {
        src: url,
        alt: `${title} ${index + 1}`,
      },
    ],
  }));

  // Build essay object
  const essay = {
    title,
    description: "",
    pubDate: dateStr,
    author: "paskal",
    ...(options?.rolls && options.rolls.length > 0 && { rolls: options.rolls }),
    ...(options?.filmStocks &&
      options.filmStocks.length > 0 && { filmStocks: options.filmStocks }),
    tags: options?.tags || [],
    cover: {
      src: imageURLs[0],
      alt: `${title} cover`,
    },
    spreads,
  };

  const yamlContent = formatYamlWithSpacing(essay, ['spreads']);
  return saveFile(filePath, yamlContent);
};

interface FilmRollObject {
  manualId: string; // This is needed to store the roll ID in the yaml file since Astro collection utils can't be used during the utility scripts.
  film: string;
  camera: string;
  format: string;
  cover?: string;
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
      labels?: string[];
      location?: string;
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
  useVisionAPI?: boolean;
}) => {
  const { shots, rollName, film, camera, format, description, useVisionAPI } =
    options;

  let roll: FilmRollObject = {
    manualId: slugify(rollName).toUpperCase(),
    film,
    camera,
    format,
    description,
    cover: "001",
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

  // Enrich with Vision API if requested
  if (useVisionAPI) {
    try {
      console.log("🔍 Enriching roll with Vision API descriptions...");
      const { RollDescriptionUpdater } = await import(
        "./update-roll-descriptions.js"
      );
      const updater = new RollDescriptionUpdater(false); // No backups needed for new rolls
      roll = await updater.enrichRollWithVisionData(roll);
    } catch (error: any) {
      console.warn(`⚠️  Vision API enrichment failed: ${error.message}`);
      console.log("📝 Continuing with basic alt text descriptions...");
    }
  }

  const firstDate = roll.shots[0].date
    ? new Date(roll.shots[0].date)
    : new Date();
  const firstYear = firstDate.getFullYear().toString();

  const fileName = slugify(rollName).toUpperCase() + ".yaml";
  roll.manualId = `${firstYear}/${roll.manualId}`;
  const filePath = `${path.normalize("./src/content/rolls/" + firstYear)}/${fileName}`;
  const yamlContent = formatYamlWithSpacing(roll, ['shots']);

  return saveFile(filePath, yamlContent);
};

const getRollData = async (rollName: string) => {
  const basePath = path.normalize("./src/content/rolls/");
  let files = fs.readdirSync(basePath, {
    withFileTypes: true,
    recursive: true,
  });
  files = files.filter((file) => file.name.endsWith(".yaml"));
  const rollFile = files.find((file) =>
    file.name.toLowerCase().includes(rollName.toLowerCase()),
  );
  return rollFile
    ? (parse(
        fs.readFileSync(path.join(rollFile.path, rollFile.name), "utf8"),
      ) as FilmRollObject)
    : undefined;
};

export const createEssayFromRolls = async (
  rolls: string[],
  essayTitle?: string,
  options?: { tags?: string[] },
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
  const title =
    essayTitle ||
    `Draft essay: ${rollsData.map((roll) => roll.manualId).join(", ")}`;
  const dateStr = now.toISOString().split("T")[0];
  const fileName = slugify(dateStr + "-" + title) + ".yaml";
  const filePath = path.normalize("./src/content/photoessays/") + fileName;

  // Extract film stocks from rolls (unique values)
  const filmStocks = [...new Set(rollsData.map((roll) => roll.film))];

  // Extract roll IDs
  const rollIds = rollsData.map((roll) => roll.manualId);

  // Collect all visible shots from all rolls
  const allShots: { src: string; alt: string }[] = [];
  for (const roll of rollsData) {
    for (const shot of roll.shots) {
      if (!shot.hidden) {
        allShots.push({
          src: shot.image.src,
          alt: shot.image.alt,
        });
      }
    }
  }

  // Build spreads with varied layouts for visual interest
  // Pattern: single → duo → trio → repeat
  const spreads: {
    layout: string;
    photos: { src: string; alt: string }[];
  }[] = [];
  const layoutPattern = ["single", "duo", "trio"];
  let patternIndex = 0;
  let shotIndex = 0;

  while (shotIndex < allShots.length) {
    const layout = layoutPattern[patternIndex % layoutPattern.length];
    const photosNeeded = layout === "single" ? 1 : layout === "duo" ? 2 : 3;
    const photosAvailable = allShots.length - shotIndex;

    // If we don't have enough photos for this layout, use what's left
    const photosToUse = Math.min(photosNeeded, photosAvailable);
    const actualLayout =
      photosToUse === 1 ? "single" : photosToUse === 2 ? "duo" : "trio";

    const photos = allShots.slice(shotIndex, shotIndex + photosToUse);
    spreads.push({
      layout: actualLayout,
      photos,
    });

    shotIndex += photosToUse;
    patternIndex++;
  }

  // Use first visible shot as cover
  const cover =
    allShots.length > 0
      ? { src: allShots[0].src, alt: allShots[0].alt }
      : { src: "", alt: title };

  // Build essay object
  const essay = {
    title,
    description: "",
    pubDate: dateStr,
    author: "paskal",
    rolls: rollIds,
    filmStocks,
    tags: options?.tags || [],
    cover,
    spreads,
  };

  const yamlContent = formatYamlWithSpacing(essay, ['spreads']);
  return saveFile(filePath, yamlContent);
};
