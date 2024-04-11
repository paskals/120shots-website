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

const getRandomString = (length?: number) => {
  return Math.ceil(Math.random() * 10 ** 9)
    .toString(16)
    .slice(-(length || 6))
    .toUpperCase();
};

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
        describe: "Whether to randomize the suffixes of the photos",
        type: "boolean",
        default: false,
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
  const { sourcePath, randomSuffix, postTitle, maxDimensionSize } = argv;

  if (destinationDir.slice(-1) != "/") {
    destinationDir = destinationDir.concat("/");
  }

  let tmpFolder = "./tmp";
  const now = new Date().toISOString();

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
  const files = fs.readdirSync(sourcePath);

  const promises: Promise<OutputInfo>[] = [];
  const paths: string[] = [];

  console.info("Processing files...");
  // Loop over each file
  for (const file of files) {
    const fileName = file
      .split(".")[0]
      .concat("-", randomSuffix ? getRandomString() : "");
    const filePath = path.join(tempDestination, `${fileName}.webp`);

    promises.push(
      sharp(path.join(sourcePath, file))
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
      console.info("Uploading files...");
      return uploadFiles(paths, destinationDir);
    })
    .then((result) => {
      console.log(result);
      // console.info('Creating post...') // TODO: create post
      console.info("Done!");
    });
} else {
  console.error("Invalid command");
}
