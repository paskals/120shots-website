import dotenv from "dotenv";
import { R2 } from "node-cloudflare-r2";

dotenv.config();

const r2 = new R2({
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
});

const bucket = r2.bucket(process.env.BUCKET_NAME || "images-cdn");
const topLevelDir = process.env.TOP_LEVEL_DIR || "";

const publicURL = process.env.BUCKET_PUBLIC_URL;

if (publicURL !== undefined) {
  await bucket.provideBucketPublicUrl(publicURL);
}
/**
 * Uploads to a CloudFlare R2 bucket. CloudFlare config is done via an .env file.
 * @param paths file paths for files to upload
 * @param destinationDir destination directory in the R2 bucket. Must always end with '/'
 * @returns the URLs of the uploaded files, null if upload failed
 */
export async function uploadFiles(
  paths: string[],
  destinationDir: string,
): Promise<(string | null)[]> {
  let destinationDir_ = destinationDir;
  // Ensure that the destination dir always ends with '/'
  if (destinationDir.slice(-1) != "/") {
    destinationDir_ = destinationDir.concat("/");
  }

  const results: (string | null)[] = [];

  for (const path of paths) {
    console.log("\tUploading file: ", path);

    const filename = path.split("/").pop() || "";
    const upload = await bucket.uploadFile(
      path,
      topLevelDir + destinationDir_ + filename,
    ).catch((err) => {
      console.info("Error uploading file: ", path);
      console.error(err);
    });
    results.push(upload?.publicUrl || null);
  }

  return results;
}
