import dotenv from "dotenv";
import path from "path";
import { R2 } from "node-cloudflare-r2";

// Load .env from the project root (cms is a subfolder)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const r2 = new R2({
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
});

const bucketName = process.env.BUCKET_NAME || "images-cdn";
const bucket = r2.bucket(bucketName);
const publicURL = process.env.BUCKET_PUBLIC_URL || "";

if (publicURL) {
  bucket.provideBucketPublicUrl(publicURL);
}

/**
 * Extracts the R2 object key from a public URL.
 * E.g., "https://cdn.120shots.com/images/TPE-01/photo.webp" -> "images/TPE-01/photo.webp"
 */
function extractObjectKey(photoUrl: string): string | null {
  if (!publicURL) return null;

  // Remove trailing slash from publicURL if present
  const baseUrl = publicURL.replace(/\/$/, "");

  if (!photoUrl.startsWith(baseUrl)) {
    return null;
  }

  // Extract path after the public URL
  const path = photoUrl.slice(baseUrl.length);
  // Remove leading slash if present
  const relativePath = path.startsWith("/") ? path.slice(1) : path;

  // The object key is topLevelDir + relativePath (but topLevelDir may already be in the URL path)
  // Since the public URL structure is: publicURL/topLevelDir/rest-of-path
  // And the object key is: topLevelDir + rest-of-path
  // But if topLevelDir is "images/" and URL is "https://cdn.120shots.com/images/TPE-01/photo.webp"
  // Then relativePath is "images/TPE-01/photo.webp" which is already the full object key
  return relativePath;
}

/**
 * Deletes a photo from the R2 bucket.
 * @param photoUrl The public URL of the photo
 * @returns true if deletion was successful, throws on error
 */
export async function deletePhotoFromR2(photoUrl: string): Promise<boolean> {
  const objectKey = extractObjectKey(photoUrl);

  console.log("[R2 Delete] Photo URL:", photoUrl);
  console.log("[R2 Delete] Public URL config:", publicURL);
  console.log("[R2 Delete] Extracted object key:", objectKey);

  if (!objectKey) {
    throw new Error(
      `Could not extract object key from URL: ${photoUrl}. Check BUCKET_PUBLIC_URL configuration (current: ${publicURL || "not set"}).`
    );
  }

  try {
    const result = await bucket.deleteObject(objectKey);
    console.log("[R2 Delete] Delete result:", result);
    return true;
  } catch (err: any) {
    console.error("[R2 Delete] Error:", err);
    throw new Error(`Failed to delete object from R2: ${err.message}`);
  }
}
