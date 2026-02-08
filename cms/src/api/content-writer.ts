import fs from "fs";
import path from "path";
import { parse, stringify } from "yaml";
import type { Essay, Roll, Shot } from "../types";

const CONTENT_DIR = path.resolve(__dirname, "../../../src/content");

/**
 * Adds blank lines between top-level items in specified YAML arrays.
 * Ported from src/utils/utils.ts to maintain format consistency.
 */
function addBlankLinesBetweenArrayItems(
  yamlString: string,
  arrayNames: string[]
): string {
  const lines = yamlString.split("\n");
  const result: string[] = [];
  let currentArray: string | null = null;
  let firstItemInArray = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let justEnteredArray = false;

    for (const arrayName of arrayNames) {
      if (line === `${arrayName}:`) {
        currentArray = arrayName;
        firstItemInArray = true;
        justEnteredArray = true;
        break;
      }
    }

    if (
      currentArray &&
      !justEnteredArray &&
      line.length > 0 &&
      !line.startsWith(" ")
    ) {
      currentArray = null;
    }

    if (currentArray && line.match(/^  - /)) {
      if (!firstItemInArray) {
        result.push("");
      }
      firstItemInArray = false;
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * Converts object to YAML with custom formatting and spacing.
 * Ported from src/utils/utils.ts.
 */
function formatYamlWithSpacing(
  obj: any,
  arrayNamesToSpace: string[] = []
): string {
  let yamlString = stringify(obj, {
    indent: 2,
    lineWidth: 0,
    minContentWidth: 0,
    defaultStringType: "PLAIN",
    defaultKeyType: "PLAIN",
  });

  if (arrayNamesToSpace.length > 0) {
    yamlString = addBlankLinesBetweenArrayItems(yamlString, arrayNamesToSpace);
  }

  return yamlString;
}

/**
 * Builds a YAML-serializable essay object with correct key ordering.
 */
function buildEssayObject(essay: Essay): Record<string, any> {
  const obj: Record<string, any> = {};
  obj.title = essay.title;
  obj.description = essay.description;
  obj.pubDate = essay.pubDate;
  if (essay.updatedDate) obj.updatedDate = essay.updatedDate;
  obj.author = essay.author;
  if (essay.rolls && essay.rolls.length > 0) obj.rolls = essay.rolls;
  if (essay.filmStocks && essay.filmStocks.length > 0)
    obj.filmStocks = essay.filmStocks;
  if (essay.tags) obj.tags = essay.tags;
  if (essay.cover) obj.cover = essay.cover;
  obj.spreads = essay.spreads.map((s) => {
    const spread: Record<string, any> = {
      layout: s.layout,
      photos: s.photos.map((p) => {
        const photo: Record<string, any> = { src: p.src, alt: p.alt };
        if (p.fit && p.fit !== "cover") photo.fit = p.fit;
        return photo;
      }),
    };
    if (s.caption) spread.caption = s.caption;
    return spread;
  });
  return obj;
}

export class ContentWriter {
  /**
   * Save an essay to disk, creating a .bak backup first.
   * Returns the file path written.
   */
  saveEssay(essay: Essay): string {
    const essaysDir = path.join(CONTENT_DIR, "photoessays");
    const filePath = path.join(essaysDir, `${essay.id}.yaml`);

    // Validate path to prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const resolvedEssaysDir = path.resolve(essaysDir);
    if (!resolvedPath.startsWith(resolvedEssaysDir + path.sep) && resolvedPath !== resolvedEssaysDir) {
      throw new Error("Invalid essay ID: path traversal detected");
    }

    // Create backup if file exists
    if (fs.existsSync(filePath)) {
      const backup = filePath + ".bak";
      fs.copyFileSync(filePath, backup);
    }

    const obj = buildEssayObject(essay);
    const yaml = formatYamlWithSpacing(obj, ["spreads"]);
    fs.writeFileSync(filePath, yaml, "utf-8");

    return filePath;
  }

  /**
   * Rename an essay file on disk. Creates a .bak backup of the old file first.
   * No-op if oldId === newId.
   */
  renameEssay(oldId: string, newId: string): void {
    if (oldId === newId) return;

    if (!newId || !newId.trim()) {
      throw new Error("New essay ID cannot be empty");
    }

    const essaysDir = path.join(CONTENT_DIR, "photoessays");
    const oldPath = path.join(essaysDir, `${oldId}.yaml`);
    const newPath = path.join(essaysDir, `${newId}.yaml`);

    // Validate both paths to prevent directory traversal
    const resolvedOldPath = path.resolve(oldPath);
    const resolvedNewPath = path.resolve(newPath);
    const resolvedEssaysDir = path.resolve(essaysDir);

    if (!resolvedOldPath.startsWith(resolvedEssaysDir + path.sep) && resolvedOldPath !== resolvedEssaysDir) {
      throw new Error("Invalid old essay ID: path traversal detected");
    }

    if (!resolvedNewPath.startsWith(resolvedEssaysDir + path.sep) && resolvedNewPath !== resolvedEssaysDir) {
      throw new Error("Invalid new essay ID: path traversal detected");
    }

    if (!fs.existsSync(oldPath)) {
      throw new Error(`Essay not found: ${oldId}.yaml`);
    }

    if (fs.existsSync(newPath)) {
      throw new Error(`Essay already exists: ${newId}.yaml`);
    }

    // Create backup before rename
    fs.copyFileSync(oldPath, oldPath + ".bak");
    fs.renameSync(oldPath, newPath);
  }

  /**
   * Finds the file path for a roll given its ID.
   * Roll IDs are in format "year/name" (e.g., "2021/TPE-01").
   */
  private findRollPath(rollId: string): string | null {
    const rollsDir = path.join(CONTENT_DIR, "rolls");

    // First, search by manualId in all roll files
    const years = fs
      .readdirSync(rollsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const yearDir of years) {
      const yearPath = path.join(rollsDir, yearDir.name);
      const files = fs.readdirSync(yearPath).filter((f) => f.endsWith(".yaml"));

      for (const file of files) {
        const filePath = path.join(yearPath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = parse(content) as any;

        // Check if manualId matches
        if (data.manualId === rollId) {
          return filePath;
        }

        // Check if path-based ID matches
        const pathId = `${yearDir.name}/${file.replace(".yaml", "")}`;
        if (pathId === rollId) {
          return filePath;
        }
      }
    }

    return null;
  }

  /**
   * Builds a YAML-serializable roll object with correct key ordering.
   */
  private buildRollObject(data: any): Record<string, any> {
    const obj: Record<string, any> = {};
    if (data.manualId) obj.manualId = data.manualId;
    obj.film = data.film;
    if (data.camera) obj.camera = data.camera;
    obj.format = data.format;
    if (data.description) obj.description = data.description;
    if (data.cover) obj.cover = data.cover;
    obj.shots = data.shots.map((s: any) => {
      const shot: Record<string, any> = {
        sequence: s.sequence,
      };
      if (s.date) shot.date = s.date;
      if (s.offsetTime) shot.offsetTime = s.offsetTime;
      if (s.hidden !== undefined) shot.hidden = s.hidden;
      if (s.portfolio) shot.portfolio = s.portfolio;
      shot.image = {
        src: s.image.src,
        alt: s.image.alt,
      };
      if (s.image.positionx) shot.image.positionx = s.image.positionx;
      if (s.image.positiony) shot.image.positiony = s.image.positiony;
      if (s.image.labels && s.image.labels.length > 0) {
        shot.image.labels = s.image.labels;
      }
      if (s.image.location) shot.image.location = s.image.location;
      return shot;
    });
    return obj;
  }

  /**
   * Updates a shot's hidden property in a roll.
   * @param rollId The roll ID (e.g., "2021/TPE-01")
   * @param sequence The shot sequence to update
   * @param hidden Whether the shot should be hidden
   */
  updateShotHidden(rollId: string, sequence: string, hidden: boolean): void {
    const filePath = this.findRollPath(rollId);
    if (!filePath) {
      throw new Error(`Roll not found: ${rollId}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const data = parse(content) as any;

    const shot = data.shots.find((s: any) => s.sequence === sequence);
    if (!shot) {
      throw new Error(`Shot ${sequence} not found in roll ${rollId}`);
    }

    shot.hidden = hidden;

    const obj = this.buildRollObject(data);
    const yaml = formatYamlWithSpacing(obj, ["shots"]);
    fs.writeFileSync(filePath, yaml, "utf-8");
  }

  /**
   * Removes a shot from a roll.
   * @param rollId The roll ID (e.g., "2021/TPE-01")
   * @param sequence The shot sequence to remove
   */
  removeShot(rollId: string, sequence: string): void {
    const filePath = this.findRollPath(rollId);
    if (!filePath) {
      throw new Error(`Roll not found: ${rollId}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const data = parse(content) as any;

    const shotIndex = data.shots.findIndex((s: any) => s.sequence === sequence);
    if (shotIndex === -1) {
      throw new Error(`Shot ${sequence} not found in roll ${rollId}`);
    }

    data.shots.splice(shotIndex, 1);

    const obj = this.buildRollObject(data);
    const yaml = formatYamlWithSpacing(obj, ["shots"]);
    fs.writeFileSync(filePath, yaml, "utf-8");
  }

  /**
   * Create a new essay file. Returns the essay ID (filename without .yaml).
   */
  createEssay(essay: Omit<Essay, "id">, customId?: string): string {
    const dateStr =
      essay.pubDate || new Date().toISOString().split("T")[0];
    const slug = (essay.title || "draft-essay")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = customId || `${dateStr}-${slug}`;

    const essaysDir = path.join(CONTENT_DIR, "photoessays");
    const filePath = path.join(essaysDir, `${id}.yaml`);

    // Validate path to prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const resolvedEssaysDir = path.resolve(essaysDir);
    if (!resolvedPath.startsWith(resolvedEssaysDir + path.sep) && resolvedPath !== resolvedEssaysDir) {
      throw new Error("Invalid essay ID: path traversal detected");
    }

    if (fs.existsSync(filePath)) {
      throw new Error(`Essay file already exists: ${id}.yaml`);
    }

    const fullEssay: Essay = { ...essay, id };
    const obj = buildEssayObject(fullEssay);
    const yaml = formatYamlWithSpacing(obj, ["spreads"]);
    fs.writeFileSync(filePath, yaml, "utf-8");

    return id;
  }
}
