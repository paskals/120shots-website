import fs from "fs";
import path from "path";
import { parse } from "yaml";
import type {
  Film,
  Roll,
  Essay,
  EssaySummary,
  Photo,
  PhotoUsage,
} from "../types";

const CONTENT_DIR = path.resolve(__dirname, "../../../src/content");

function readYaml<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content) as T;
}

export class ContentLoader {
  private films: Map<string, Film> = new Map();
  private rolls: Map<string, Roll> = new Map();
  private essays: Map<string, Essay> = new Map();
  private photoUsage: PhotoUsage = {};
  private allPhotos: Photo[] = [];

  constructor() {
    this.reload();
  }

  reload() {
    this.films.clear();
    this.rolls.clear();
    this.essays.clear();
    this.photoUsage = {};
    this.allPhotos = [];

    this.loadFilms();
    this.loadRolls();
    this.loadEssays();
    this.buildPhotoIndex();
    this.buildUsageIndex();
  }

  private loadFilms() {
    const filmsDir = path.join(CONTENT_DIR, "films");
    if (!fs.existsSync(filmsDir)) return;

    const files = fs.readdirSync(filmsDir).filter((f) => f.endsWith(".yaml"));
    for (const file of files) {
      const id = file.replace(".yaml", "");
      const data = readYaml<Omit<Film, "id">>(path.join(filmsDir, file));
      this.films.set(id, { id, ...data });
    }
  }

  private loadRolls() {
    const rollsDir = path.join(CONTENT_DIR, "rolls");
    if (!fs.existsSync(rollsDir)) return;

    // Rolls are in year subdirectories: rolls/2021/TPE-01.yaml
    const years = fs
      .readdirSync(rollsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const yearDir of years) {
      const yearPath = path.join(rollsDir, yearDir.name);
      const files = fs
        .readdirSync(yearPath)
        .filter((f) => f.endsWith(".yaml"));

      for (const file of files) {
        const rollData = readYaml<any>(path.join(yearPath, file));
        const id = rollData.manualId || `${yearDir.name}/${file.replace(".yaml", "")}`;
        this.rolls.set(id, {
          id,
          film: rollData.film,
          camera: rollData.camera,
          format: rollData.format,
          description: rollData.description,
          cover: rollData.cover,
          shots: rollData.shots || [],
        });
      }
    }
  }

  private loadEssays() {
    const essaysDir = path.join(CONTENT_DIR, "photoessays");
    if (!fs.existsSync(essaysDir)) return;

    const files = fs
      .readdirSync(essaysDir)
      .filter((f) => f.endsWith(".yaml"));

    for (const file of files) {
      const id = file.replace(".yaml", "");
      const data = readYaml<any>(path.join(essaysDir, file));
      this.essays.set(id, {
        id,
        title: data.title,
        description: data.description,
        pubDate: data.pubDate instanceof Date ? data.pubDate.toISOString().split("T")[0] : String(data.pubDate),
        updatedDate: data.updatedDate,
        author: data.author,
        rolls: data.rolls,
        filmStocks: data.filmStocks,
        tags: data.tags,
        cover: data.cover,
        spreads: data.spreads || [],
      });
    }
  }

  private buildPhotoIndex() {
    this.allPhotos = [];
    const seenUrls = new Set<string>();
    for (const [rollId, roll] of this.rolls) {
      for (const shot of roll.shots) {
        // Deduplicate by URL - skip if we've already seen this photo
        if (seenUrls.has(shot.image.src)) {
          continue;
        }
        seenUrls.add(shot.image.src);
        this.allPhotos.push({
          src: shot.image.src,
          alt: shot.image.alt,
          rollId,
          rollName: rollId.split("/").pop() || rollId,
          filmId: roll.film,
          camera: roll.camera,
          date: shot.date,
          sequence: shot.sequence,
          labels: shot.image.labels,
          location: shot.image.location,
          hidden: shot.hidden,
        });
      }
    }
    // Sort by date descending (newest first)
    this.allPhotos.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  private buildUsageIndex() {
    this.photoUsage = {};
    for (const [essayId, essay] of this.essays) {
      for (const spread of essay.spreads) {
        for (const photo of spread.photos) {
          if (!this.photoUsage[photo.src]) {
            this.photoUsage[photo.src] = [];
          }
          this.photoUsage[photo.src].push(essayId);
        }
      }
    }
  }

  // --- Public API ---

  getFilms(): Film[] {
    return Array.from(this.films.values());
  }

  getFilm(id: string): Film | undefined {
    return this.films.get(id);
  }

  getRolls(): Roll[] {
    return Array.from(this.rolls.values());
  }

  getRoll(id: string): Roll | undefined {
    return this.rolls.get(id);
  }

  getPhotos(filters?: {
    roll?: string;
    film?: string;
    camera?: string;
    unused?: boolean;
    search?: string;
    includeHidden?: boolean;
  }): Photo[] {
    let photos = this.allPhotos;

    if (!filters?.includeHidden) {
      photos = photos.filter((p) => !p.hidden);
    }

    if (filters?.roll) {
      photos = photos.filter((p) => p.rollId === filters.roll);
    }
    if (filters?.film) {
      photos = photos.filter((p) => p.filmId === filters.film);
    }
    if (filters?.camera) {
      photos = photos.filter(
        (p) => p.camera?.toLowerCase() === filters.camera!.toLowerCase()
      );
    }
    if (filters?.unused) {
      photos = photos.filter((p) => !this.photoUsage[p.src]?.length);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      photos = photos.filter(
        (p) =>
          p.alt.toLowerCase().includes(q) ||
          p.labels?.some((l) => l.toLowerCase().includes(q)) ||
          p.location?.toLowerCase().includes(q)
      );
    }

    return photos;
  }

  getEssays(): EssaySummary[] {
    return Array.from(this.essays.values()).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      pubDate: e.pubDate,
      tags: e.tags,
      rolls: e.rolls,
      filmStocks: e.filmStocks,
      cover: e.cover,
      spreadCount: e.spreads.length,
    }));
  }

  getEssay(id: string): Essay | undefined {
    return this.essays.get(id);
  }

  getUsage(): PhotoUsage {
    return this.photoUsage;
  }

  getCameras(): string[] {
    const cameras = new Set<string>();
    for (const roll of this.rolls.values()) {
      if (roll.camera) cameras.add(roll.camera);
    }
    return Array.from(cameras).sort();
  }
}
