// Types mirroring the Astro content collection schemas

export interface Film {
  id: string; // filename without .yaml
  name: string;
  brand: string;
  color: "color-negative" | "color-positive" | "black-and-white-negative" | "special-negative";
  iso: string;
  description?: string;
}

export interface ShotImage {
  src: string;
  alt: string;
  positionx?: string;
  positiony?: string;
  labels?: string[];
  location?: string;
}

export interface Shot {
  sequence: string;
  date?: string;
  offsetTime?: string;
  hidden?: boolean;
  portfolio?: "landscape" | "street" | "panorama" | "portrait";
  image: ShotImage;
}

export interface Roll {
  id: string; // e.g. "2021/TPE-01"
  film: string; // film ID reference
  camera?: string;
  format: "half-frame" | "35mm" | "645" | "6x6" | "6x7" | "6x8" | "6x9" | "4x5";
  description?: string;
  cover?: string;
  shots: Shot[];
}

export interface SpreadPhoto {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
}

export type SpreadLayout =
  | "single"
  | "duo"
  | "duo-h"
  | "duo-l"
  | "duo-r"
  | "trio"
  | "trio-l"
  | "trio-r";

export interface Spread {
  layout: SpreadLayout;
  photos: SpreadPhoto[];
  caption?: string;
}

export interface EssayCover {
  src: string;
  alt: string;
}

export interface Essay {
  id: string; // filename without .yaml
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  author: string;
  rolls?: string[];
  filmStocks?: string[];
  tags?: string[];
  cover?: EssayCover;
  spreads: Spread[];
}

// Lightweight essay for list views
export interface EssaySummary {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  tags?: string[];
  rolls?: string[];
  filmStocks?: string[];
  cover?: EssayCover;
  spreadCount: number;
}

// Photo with source roll context
export interface Photo {
  src: string;
  alt: string;
  rollId: string;
  rollName: string;
  filmId: string;
  camera?: string;
  date?: string;
  sequence: string;
  labels?: string[];
  location?: string;
  hidden?: boolean;
}

// Photo usage tracking
export interface PhotoUsage {
  [photoSrc: string]: string[]; // src -> essay IDs
}
