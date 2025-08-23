/**
 * Helper script to update film roll descriptions using Google Vision API
 *
 * This script can be used standalone or imported into other utilities:
 * - Fetches Vision API descriptions for all images in rolls
 * - Updates alt text with formatted descriptions
 * - Adds labels and location fields
 * - Creates backups before modifying files
 * - Supports both batch and single roll processing
 */

import { config } from "dotenv";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { GoogleVisionImageDescriber } from "./vision-describer.js";

// Load environment variables
config();

interface ImageData {
  src: string;
  alt: string;
  positionx?: string;
  positiony?: string;
  labels?: string[];
  location?: string;
}

interface ShotData {
  sequence: string;
  date?: string;
  offsetTime?: string;
  hidden?: boolean;
  portfolio?: string;
  image: ImageData;
}

interface RollData {
  manualId: string;
  film: string;
  camera: string;
  format: string;
  cover?: string;
  description?: string;
  shots: ShotData[];
}

export class RollDescriptionUpdater {
  private describer: GoogleVisionImageDescriber;
  private rollsBasePath = "src/content/rolls";
  private createBackups: boolean;

  constructor(createBackups: boolean = true) {
    this.describer = new GoogleVisionImageDescriber();
    this.createBackups = createBackups;
    if (this.createBackups) {
      this.ensureBackupDir("2021"); // Default for existing behavior
    }
  }

  private ensureBackupDir(year: string) {
    const backupPath = path.join(this.rollsBasePath, year, ".backups");
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
      console.log(`📁 Created backup directory: ${backupPath}`);
    }
    return backupPath;
  }

  /**
   * Update a single roll by year and name
   */
  async updateSingleRoll(year: string, rollName: string): Promise<boolean> {
    const rollPath = path.join(this.rollsBasePath, year);
    const rollFile = `${rollName}.yaml`;
    const filePath = path.join(rollPath, rollFile);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Roll file not found: ${filePath}`);
    }

    console.log(`\n📸 Processing ${year}/${rollName}...`);

    try {
      await this.updateRoll(rollFile, year);
      console.log(`✅ Successfully updated ${year}/${rollName}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to update ${year}/${rollName}:`, error.message);
      return false;
    }
  }

  /**
   * Enrich roll data with Vision API descriptions (for new roll creation)
   */
  async enrichRollWithVisionData(rollData: RollData): Promise<RollData> {
    console.log(
      `🔍 Enriching roll ${rollData.manualId} with Vision API descriptions...`,
    );

    // Extract image URLs
    const imageUrls = rollData.shots.map((shot) => shot.image.src);
    console.log(`🔍 Found ${imageUrls.length} images to process`);

    // Process with Vision API
    const results = await this.describer.describeImageBatch(
      imageUrls,
      "detailed",
      150,
    );
    console.log(
      `📊 Vision API results: ${results.successRate.toFixed(1)}% success rate`,
    );

    // Update roll data with Vision API results
    let updatedCount = 0;
    for (let i = 0; i < rollData.shots.length; i++) {
      const shot = rollData.shots[i];
      const visionResult = results.successful.find(
        (r) => r.url === shot.image.src,
      );

      if (visionResult) {
        // Format new alt text
        const labelsText = visionResult.labels
          .slice(0, 6)
          .map((l) => l.toLowerCase())
          .join(", ");
        const locationText =
          visionResult.landmarks.length > 0
            ? this.formatLocation(visionResult.landmarks[0])
            : "";

        let newAlt = `Film photo of ${labelsText}`;
        if (locationText) {
          newAlt += `. Location: ${locationText}`;
        }
        newAlt += ".";

        // Update image data
        shot.image.alt = newAlt;
        shot.image.labels = visionResult.labels.slice(0, 10); // Store more labels for future use
        if (locationText) {
          shot.image.location = locationText;
        }

        updatedCount++;
      }
    }

    console.log(
      `💾 Enriched ${updatedCount}/${rollData.shots.length} images with Vision API data`,
    );
    return rollData;
  }

  async updateAllRolls() {
    const rollFiles = [
      "EHV-01.yaml",
      "LUX-01.yaml",
      "TN-01.yaml",
      "TPE-01.yaml",
    ];

    console.log("🚀 Starting roll description updates...\n");

    for (const rollFile of rollFiles) {
      console.log(`\n📸 Processing ${rollFile}...`);
      try {
        await this.updateRoll(rollFile, "2021");
        console.log(`✅ Successfully updated ${rollFile}`);
      } catch (error: any) {
        console.error(`❌ Failed to update ${rollFile}:`, error.message);
      }
    }

    console.log("\n🎉 Roll description updates completed!");
  }

  private async updateRoll(filename: string, year: string) {
    const rollPath = path.join(this.rollsBasePath, year);
    const filePath = path.join(rollPath, filename);

    let backupPath = "";
    if (this.createBackups) {
      const backupDir = this.ensureBackupDir(year);
      backupPath = path.join(backupDir, `${filename}.backup`);
    }

    // Read and parse YAML
    const yamlContent = fs.readFileSync(filePath, "utf8");
    const rollData: RollData = yaml.parse(yamlContent);

    // Create backup if enabled
    if (this.createBackups && backupPath) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`💾 Created backup: ${backupPath}`);
    }

    // Extract image URLs
    const imageUrls = rollData.shots.map((shot) => shot.image.src);
    console.log(`🔍 Found ${imageUrls.length} images to process`);

    // Process with Vision API
    const results = await this.describer.describeImageBatch(
      imageUrls,
      "detailed",
      150,
    );

    console.log(
      `📊 Batch results: ${results.successRate.toFixed(1)}% success rate`,
    );

    // Update roll data with Vision API results
    let updatedCount = 0;
    for (let i = 0; i < rollData.shots.length; i++) {
      const shot = rollData.shots[i];
      const visionResult = results.successful.find(
        (r) => r.url === shot.image.src,
      );

      if (visionResult) {
        // Format new alt text
        const labelsText = visionResult.labels
          .slice(0, 6)
          .map((l) => l.toLowerCase())
          .join(", ");
        const locationText =
          visionResult.landmarks.length > 0
            ? this.formatLocation(visionResult.landmarks[0])
            : "";

        let newAlt = `Film photo of ${labelsText}`;
        if (locationText) {
          newAlt += `. Location: ${locationText}`;
        }
        newAlt += ".";

        // Update image data
        shot.image.alt = newAlt;
        shot.image.labels = visionResult.labels.slice(0, 10); // Store more labels for future use
        if (locationText) {
          shot.image.location = locationText;
        }

        updatedCount++;
        console.log(
          `  ✓ Updated shot ${shot.sequence}: ${newAlt.substring(0, 60)}...`,
        );
      } else {
        console.log(
          `  ⚠️  Skipped shot ${shot.sequence}: No Vision API result`,
        );
      }
    }

    // Save updated YAML
    const updatedYaml = yaml.stringify(rollData, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0,
    });

    fs.writeFileSync(filePath, updatedYaml, "utf8");
    console.log(
      `💾 Saved updated file with ${updatedCount}/${rollData.shots.length} images updated`,
    );
  }

  private formatLocation(landmark: string): string {
    // The Vision API sometimes returns locations with additional context
    // Try to make them more readable and add geography context when possible
    const location = landmark.trim();

    // For now, return the landmark as-is
    // In the future, we could enhance this with geocoding to add city/country
    return location;
  }

  async restoreFromBackups(year: string = "2021") {
    console.log(`🔄 Restoring files from ${year} backups...`);

    const backupDir = path.join(this.rollsBasePath, year, ".backups");
    if (!fs.existsSync(backupDir)) {
      console.log(`⚠️  No backup directory found for ${year}`);
      return;
    }

    const backupFiles = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".backup"));

    for (const backupFile of backupFiles) {
      const originalFile = backupFile.replace(".backup", "");
      const backupFilePath = path.join(backupDir, backupFile);
      const originalFilePath = path.join(
        this.rollsBasePath,
        year,
        originalFile,
      );

      fs.copyFileSync(backupFilePath, originalFilePath);
      console.log(`✅ Restored ${originalFile}`);
    }

    console.log(`🎉 All ${year} files restored from backups!`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const updater = new RollDescriptionUpdater();

  try {
    if (command === "restore") {
      await updater.restoreFromBackups();
    } else {
      await updater.updateAllRolls();
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}
