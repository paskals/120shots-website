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
  const promises = paths.map(async (path) => {
    const filename = path.split("/").pop() || "";
    const upload = await bucket.uploadFile(
      path,
      topLevelDir + destinationDir + filename,
    );
    return upload.publicUrl;
  });

  return Promise.all(promises);
}
