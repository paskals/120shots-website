/**
 * This script is used to create a draft blog post from a folder of photos.
 * Photos will be uploaded to a CloudFlare R2 bucket and the post will contain
 * URLs to all photos in the specified folder.
 */
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import fs from "fs";
import path from "path";
import { uploadFiles } from "./r2-wrangler";
import { getRandomString, createNewPost, getSourceFiles, createTempDir, processFiles, deleteTempFiles } from "./utils";
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
  .help().argv;

if (argv._.includes("create-post")) {
  // Prep Arguments

  const { sourcePath, randomSuffix, postTitle, maxDimensionSize, renameFiles } =
    argv;

  let destinationDir = argv.destinationDir;
  // Ensure that the destination dir always ends with '/'
  if (destinationDir.slice(-1) != "/") {
    destinationDir = destinationDir.concat("/");
  }

  //======= Get Source Files =====
  const files = getSourceFiles(sourcePath);
  const tempDestination = createTempDir(destinationDir);

  // ===== Process Files =====
  console.info("🔄 Processing files...");
  const processedFilesInfo = await processFiles(files, { tempDestination, maxDimensionSize, renameFiles, randomSuffix })
  const newFiles = processedFilesInfo.map(v => v.filePath)

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
    }).finally(() => {
      // ====== Delete TMP files ====
      deleteTempFiles(newFiles)
    });
}
if (argv._.includes("create-roll")) {
  console.error("not implemented")
}
else {
  console.error("Invalid command");
}
