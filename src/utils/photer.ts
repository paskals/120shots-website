/**
 * This script is used to create a draft blog post from a folder of photos.
 * Photos will be uploaded to a CloudFlare R2 bucket and the post will contain
 * URLs to all photos in the specified folder.
 */
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import fs from "fs";
import path from "path";
import sharp, { type OutputInfo } from "sharp";
import { uploadFiles } from "./r2-wrangler";
import { getRandomString, createNewPost } from "./utils";
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
  // Do stuff
  let { destinationDir } = argv;
  const { sourcePath, randomSuffix, postTitle, maxDimensionSize, renameFiles } =
    argv;

  if (destinationDir.slice(-1) != "/") {
    destinationDir = destinationDir.concat("/");
  }

  let tmpFolder = "./tmp";

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

  // Get all files from the specified sourcePath
  const files = fs.readdirSync(sourcePath, { withFileTypes: true });

  const promises: Promise<OutputInfo>[] = [];
  const paths: string[] = [];

  console.info("🔄 Processing files...");
  // Loop over each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.isDirectory() || file.name.startsWith(".")) {
      continue;
    }

    let fileName = "";

    if (renameFiles !== undefined) {
      fileName = sanitize(renameFiles)
        .concat("-", i.toString().padStart(3, "0"))
        .replace(/\s+/g, "_");
    } else {
      fileName = file.name.split(".")[0].replace(/\s+/g, "_");
    }

    if (randomSuffix) {
      fileName = fileName.concat("-", getRandomString());
    }
    const filePath = path.join(tempDestination, `${fileName}.webp`);

    promises.push(
      sharp(path.join(sourcePath, file.name))
        .resize({
          width: maxDimensionSize,
          height: maxDimensionSize,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 80,
          effort: 0,
          smartSubsample: true,
        })
        .toFile(filePath),
    );
    paths.push(filePath);
  }

  Promise.all(promises)
    .then(() => {
      console.info("⏫ Uploading files...");
      return uploadFiles(paths, destinationDir);
    })
    .then((result) => {
      return createNewPost(result as string[], postTitle, {
        referencedImages: result,
      }).then((result) => {
        console.info(`✅ Post created at ${path.normalize(result)}`);
      });
    });
} else {
  console.error("Invalid command");
}
