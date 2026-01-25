/**
 * This script is used to create a draft blog post from a folder of photos.
 * Photos will be uploaded to a CloudFlare R2 bucket and the post will contain
 * URLs to all photos in the specified folder.
 */
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import path from "path";
import { uploadFiles } from "./r2-wrangler";
import {
  createNewEssay,
  getSourceFiles,
  createTempDir,
  processFiles,
  deleteTempFiles,
  createNewRoll,
  createEssayFromRolls,
} from "./utils.js";
import sanitize from "sanitize-filename";

const argv = yargs(hideBin(process.argv))
  .command(
    "create-essay",
    "Gets photos from a folder, converts and processes them, uploads them to an R2 bucket and creates a draft YAML essay containing the URLs of all the photos uploaded.",
    {
      sourcePath: {
        alias: "p",
        describe: "sourcePath to photos to upload (non-recursive)",
        type: "string",
        demandOption: true,
      },
      destinationDir: {
        alias: "d",
        describe:
          "Destination directory in the R2 bucket. Must always end with '/'",
        type: "string",
        demandOption: true,
      },
      maxDimensionSize: {
        alias: "m",
        describe:
          "Maximum dimension size (of either height or width) of the converted photos in px.",
        type: "number",
        default: 2000,
      },
      randomSuffix: {
        alias: "s",
        describe: "Whether to add a random suffix to the file name",
        type: "boolean",
        default: false,
      },
      renameFiles: {
        alias: "r",
        describe:
          "If not specified, the original file names will be kept. When specified, this will be used as the file name prefix, after which a numeric sequence number will be added. If a random suffix is also specified, it will be added after the sequence number.",
        type: "string",
        demandOption: false,
      },
      essayTitle: {
        alias: "t",
        describe: "Title of the essay",
        type: "string",
        demandOption: false,
      },
    },
  )
  .command(
    "create-roll",
    "Gets photos from a folder, converts and processes them, uploads them to an R2 bucket and creates a yaml item in the rolls content collection.",
    {
      sourcePath: {
        alias: "p",
        describe: "sourcePath to photos to upload (non-recursive)",
        type: "string",
        demandOption: true,
      },
      rollName: {
        alias: "n",
        describe:
          "Name of the film roll. Will also be used as the sub-directory in the upload destination.",
        type: "string",
        demandOption: true,
      },
      film: {
        alias: "f",
        describe:
          "What film type was used to shoot this roll. e.g. 'gold-200'. This must correspond to an entry from the films content library.",
        type: "string",
        default: "",
        demandOption: true,
      },
      camera: {
        alias: "c",
        describe: "What camera was used to shoot this roll.",
        type: "string",
        default: "",
        demandOption: false,
      },
      format: {
        describe: "What format was shot on this roll (e.g. 35mm, 6x6, etc)",
        type: "string",
        default: "35mm",
        demandOption: false,
      },
      maxDimensionSize: {
        alias: "m",
        describe:
          "Maximum dimension size (of either height or width) of the converted photos in px.",
        type: "number",
        default: 2000,
        demandOption: false,
      },
      randomSuffix: {
        alias: "s",
        describe: "Whether to add a random suffix to the file name",
        type: "boolean",
        default: false,
      },
      renameFiles: {
        alias: "r",
        describe:
          "If not specified, the original file names will be kept. When specified, the roll name (n) will be used as the file name prefix, after which a numeric sequence number will be added. If a random suffix is also specified, it will be added after the sequence number.",
        type: "boolean",
        demandOption: false,
      },
      skipVision: {
        describe:
          "Skip Google Vision API integration for generating image descriptions",
        type: "boolean",
        default: false,
      },
    },
  )
  .command("create-roll-essay", "Creates an essay from existing rolls.", {
    rolls: {
      alias: "r",
      describe: "Comma separated list of roll IDs to include in the essay",
      type: "string",
      demandOption: true,
    },
    essayTitle: {
      alias: "t",
      describe: "Title of the essay",
      type: "string",
      demandOption: false,
    },
  })
  .help().argv;

if (argv._.includes("create-essay")) {
  // Prep Arguments

  const {
    sourcePath,
    destinationDir,
    randomSuffix,
    essayTitle,
    maxDimensionSize,
    renameFiles,
  } = argv;

  //======= Get Source Files =====
  const files = getSourceFiles(sourcePath);
  const tempDestination = createTempDir(destinationDir);

  // ===== Process Files =====
  console.info("🔄 Processing files...");
  const processedFilesInfo = await processFiles(files, {
    tempDestination,
    maxDimensionSize,
    renameFiles,
    randomSuffix,
  });
  const newFiles = processedFilesInfo.map((v) => v.filePath);

  //==== create-essay specific ====
  console.info("⏫ Uploading files...");

  uploadFiles(newFiles, destinationDir)
    .then((result) => {
      return createNewEssay(result as string[], essayTitle).then((result) => {
        console.info(`✅ Essay created at ${path.normalize(result)}`);
      });
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      // ====== Delete TMP files ====
      deleteTempFiles(newFiles);
    });
} else if (argv._.includes("create-roll")) {
  const {
    sourcePath,
    rollName,
    film,
    camera,
    format,
    randomSuffix,
    maxDimensionSize,
    renameFiles,
    skipVision,
  } = argv;

  const destinationDir = sanitize(rollName);

  //======= Get Source Files =====
  const files = getSourceFiles(sourcePath);
  const tempDestination = createTempDir(destinationDir);

  // ===== Process Files =====
  console.info("🔄 Processing files...");
  const processedFilesInfo = await processFiles(files, {
    tempDestination,
    maxDimensionSize,
    renameFiles: renameFiles ? rollName : undefined,
    randomSuffix,
  });
  const newFiles = processedFilesInfo.map((v) => v.filePath);

  //==== create-roll specific ====
  console.info("⏫ Uploading files...");

  uploadFiles(newFiles, destinationDir)
    .then((result) => {
      const urls = result as string[];
      const shots = urls.map((url, i) => {
        return {
          url: url,
          fileInfo: processedFilesInfo[i],
        };
      });
      return createNewRoll({
        shots,
        rollName,
        film,
        camera,
        format,
        useVisionAPI: !skipVision, // Use Vision API unless explicitly skipped
      }).then((result) => {
        console.info(`✅ Roll created at ${path.normalize(result)}`);
      });
    })
    .finally(() => {
      // ====== Delete TMP files ====
      deleteTempFiles(newFiles);
    });
} else if (argv._.includes("create-roll-essay")) {
  const { rolls, essayTitle } = argv;

  const result = await createEssayFromRolls(rolls.split(","), essayTitle);
  console.info(`✅ Essay created at ${path.normalize(result)}`);
} else {
  console.error("Invalid command");
}
