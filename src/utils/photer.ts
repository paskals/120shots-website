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
  createNewPost,
  getSourceFiles,
  createTempDir,
  processFiles,
  deleteTempFiles,
  createNewRoll,
  createPostFromRolls,
} from "./utils.js";
import sanitize from "sanitize-filename";

const argv = yargs(hideBin(process.argv))
  .command(
    "create-post",
    "Gets photos from a folder, converts and processes them, uploads them to an R2 bucket and creates a draft MDX post containing the URLs of all the photos uploaded.",
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
          "If not specified, the original file names will be kept. When specified, this will be used ast the file name prefix, after which a numeric sequence number will be added. If a random suffix is also specified, it will be added after the sequence number.",
        type: "string",
        demandOption: false,
      },
      postTitle: {
        alias: "t",
        describe: "Title of the post",
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
    },
  )
  .command("create-roll-post", "Creates a post from existing rolls.", {
    rolls: {
      alias: "r",
      describe: "Comma separated list of roll IDs to include in the post",
      type: "string",
      demandOption: true,
    },
    postTitle: {
      alias: "t",
      describe: "Title of the post",
      type: "string",
      demandOption: false,
    },
  })
  .help().argv;

if (argv._.includes("create-post")) {
  // Prep Arguments

  const {
    sourcePath,
    destinationDir,
    randomSuffix,
    postTitle,
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

  //==== create-post specific ====
  console.info("⏫ Uploading files...");

  uploadFiles(newFiles, destinationDir)
    .then((result) => {
      // TODO: use roll instead of list of files
      return createNewPost(result as string[], postTitle, {
        referencedImages: result,
      }).then((result) => {
        console.info(`✅ Post created at ${path.normalize(result)}`);
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
      }).then((result) => {
        console.info(`✅ Post created at ${path.normalize(result)}`);
      });
    })
    .finally(() => {
      // ====== Delete TMP files ====
      deleteTempFiles(newFiles);
    });
} else if (argv._.includes("create-roll-post")) {
  const { rolls, postTitle } = argv;

  const result = await createPostFromRolls(rolls.split(","), postTitle);
  console.info(`✅ Post created at ${path.normalize(result)}`);
} else {
  console.error("Invalid command");
}
