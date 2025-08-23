/**
 * R2 Bucket Statistics CLI Tool
 * Provides comprehensive statistics about your CloudFlare R2 bucket
 */
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import dotenv from "dotenv";
import { S3Client, ListObjectsV2Command, type _Object } from "@aws-sdk/client-s3";

dotenv.config();

interface BucketStats {
  totalObjects: number;
  totalSize: number;
  folders: Map<string, FolderStats>;
  fileTypes: Map<string, FileTypeStats>;
}

interface FolderStats {
  count: number;
  size: number;
}

interface FileTypeStats {
  count: number;
  size: number;
}

const argv = yargs(hideBin(process.argv))
  .command(
    "$0",
    "Get statistics for your CloudFlare R2 bucket",
    {
      prefix: {
        alias: "p",
        describe: "Filter objects by prefix (folder path)",
        type: "string",
        default: "",
      },
      detailed: {
        alias: "d",
        describe: "Show detailed breakdown by folders and file types",
        type: "boolean",
        default: false,
      },
      json: {
        alias: "j",
        describe: "Output as JSON",
        type: "boolean",
        default: false,
      },
      limit: {
        alias: "l",
        describe: "Maximum number of objects to process (0 = no limit)",
        type: "number",
        default: 0,
      },
    }
  )
  .help().argv;

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.BUCKET_NAME || "";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileExtension(key: string): string {
  const parts = key.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "no extension";
}

function getFolderPath(key: string): string {
  const parts = key.split("/");
  if (parts.length === 1) {
    return "(root)";
  }
  return parts.slice(0, -1).join("/") + "/";
}

async function listAllObjects(prefix: string, limit: number): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;
  let totalFetched = 0;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: Math.min(1000, limit > 0 ? limit - totalFetched : 1000),
      ContinuationToken: continuationToken,
    });

    try {
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        objects.push(...response.Contents);
        totalFetched += response.Contents.length;
      }

      continuationToken = response.NextContinuationToken;

      if (limit > 0 && totalFetched >= limit) {
        break;
      }
    } catch (error) {
      console.error("Error listing objects:", error);
      throw error;
    }
  } while (continuationToken);

  return objects;
}

function calculateStats(objects: _Object[]): BucketStats {
  const stats: BucketStats = {
    totalObjects: objects.length,
    totalSize: 0,
    folders: new Map(),
    fileTypes: new Map(),
  };

  for (const obj of objects) {
    if (!obj.Key || obj.Size === undefined) continue;

    const size = obj.Size;
    stats.totalSize += size;

    // Folder statistics
    const folderPath = getFolderPath(obj.Key);
    const folderStats = stats.folders.get(folderPath) || { count: 0, size: 0 };
    folderStats.count += 1;
    folderStats.size += size;
    stats.folders.set(folderPath, folderStats);

    // File type statistics
    const extension = getFileExtension(obj.Key);
    const typeStats = stats.fileTypes.get(extension) || { count: 0, size: 0 };
    typeStats.count += 1;
    typeStats.size += size;
    stats.fileTypes.set(extension, typeStats);
  }

  return stats;
}

function displayStats(stats: BucketStats, options: any) {
  if (options.json) {
    const jsonOutput = {
      summary: {
        totalObjects: stats.totalObjects,
        totalSize: stats.totalSize,
        totalSizeFormatted: formatBytes(stats.totalSize),
      },
      folders: Array.from(stats.folders.entries()).map(([path, data]) => ({
        path,
        count: data.count,
        size: data.size,
        sizeFormatted: formatBytes(data.size),
      })),
      fileTypes: Array.from(stats.fileTypes.entries()).map(([ext, data]) => ({
        extension: ext,
        count: data.count,
        size: data.size,
        sizeFormatted: formatBytes(data.size),
      })),
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
    return;
  }

  // Text output
  console.log("📊 R2 Bucket Statistics");
  console.log("=".repeat(50));
  console.log(`Bucket: ${bucketName}`);
  if (options.prefix) {
    console.log(`Prefix filter: ${options.prefix}`);
  }
  console.log(`Total objects: ${stats.totalObjects.toLocaleString()}`);
  console.log(`Total size: ${formatBytes(stats.totalSize)}`);
  console.log();

  if (options.detailed) {
    // Folder breakdown
    console.log("📁 Folders:");
    console.log("-".repeat(40));
    const sortedFolders = Array.from(stats.folders.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 20); // Top 20 folders by size

    for (const [path, data] of sortedFolders) {
      console.log(`${path.padEnd(30)} ${data.count.toString().padStart(6)} files  ${formatBytes(data.size).padStart(10)}`);
    }
    console.log();

    // File type breakdown
    console.log("📄 File Types:");
    console.log("-".repeat(40));
    const sortedTypes = Array.from(stats.fileTypes.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 15); // Top 15 file types by size

    for (const [ext, data] of sortedTypes) {
      console.log(`${ext.padEnd(15)} ${data.count.toString().padStart(8)} files  ${formatBytes(data.size).padStart(10)}`);
    }
  } else {
    // Quick summary
    const topFolders = Array.from(stats.folders.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 5);

    console.log("🔝 Top 5 Folders by Size:");
    for (const [path, data] of topFolders) {
      console.log(`  ${path}: ${data.count} files, ${formatBytes(data.size)}`);
    }

    const topTypes = Array.from(stats.fileTypes.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 5);

    console.log("\n🔝 Top 5 File Types by Size:");
    for (const [ext, data] of topTypes) {
      console.log(`  ${ext}: ${data.count} files, ${formatBytes(data.size)}`);
    }
  }

  console.log("\n💡 Use --detailed for full breakdown or --json for JSON output");
  if (options.limit > 0) {
    console.log(`⚠️  Limited to first ${options.limit} objects`);
  }
}

async function main() {
  try {
    if (!bucketName) {
      console.error("❌ Error: BUCKET_NAME environment variable not set");
      process.exit(1);
    }

    if (!process.env.R2_ACCOUNT_ID) {
      console.error("❌ Error: R2_ACCOUNT_ID environment variable not set");
      process.exit(1);
    }

    console.log("🔍 Fetching bucket statistics...");
    const objects = await listAllObjects(argv.prefix, argv.limit);
    
    if (objects.length === 0) {
      console.log("📭 No objects found in bucket");
      if (argv.prefix) {
        console.log(`   (with prefix: ${argv.prefix})`);
      }
      return;
    }

    const stats = calculateStats(objects);
    displayStats(stats, argv);

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);