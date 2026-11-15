// 1. Import utilities from `astro:content`
import { defineCollection, reference } from "astro:content";
import { glob } from 'astro/loaders';
import { z } from "astro/zod";

// Preserve the original file path casing as the entry id (e.g. "2021/TN-01"),
// since reference() strings throughout the content are written in that casing
// and glob()'s default generateId lowercases everything.
const generateId = ({ entry }) => entry.replace(/\.[^./]+$/, "");

const films = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/films", generateId }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    color: z.enum([
      "color-negative",
      "color-positive",
      "black-and-white-negative",
      "special-negative",
    ]),
    iso: z.coerce.number(),
    description: z.string().optional(),
  }),
});

const rolls = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/rolls", generateId }),
  schema: z.object({
    film: reference("films"),
    camera: z.string().optional(),
    format: z.enum(["half-frame", "35mm", "645", "6x6", "6x7", "6x8", "6x9", "4x5"]),
    description: z.string().optional(),
    cover: z.string().optional(),
    shots: z.array(
      z.object({
        sequence: z.coerce.string(),
        date: z.coerce.date().optional(),
        offsetTime: z.string().optional(),
        hidden: z.coerce.boolean().optional(), // for shots that are not to be displayed
        portfolio: z
          .enum(["landscape", "street", "panorama", "portrait"])
          .optional(),
        image: z.object({
          src: z.string(),
          alt: z.string(),
          positionx: z.string().optional(),
          positiony: z.string().optional(),
          labels: z.array(z.string()).optional(),
          location: z.string().optional(),
        }),
      }),
    ),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/authors", generateId }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    name: z.string(),
    email: z.string().optional(),
    description: z.string(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
        positionx: z.string().optional(),
        positiony: z.string().optional(),
      })
      .optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const photoessays = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/photoessays", generateId }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference("authors"),
    rolls: z.array(reference("rolls")).optional(),
    filmStocks: z.array(reference("films")).optional(),
    tags: z.array(z.string()).optional(),
    cover: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    spreads: z.array(
      z.object({
        layout: z.enum(["single", "duo", "duo-h", "duo-l", "duo-r", "trio", "trio-l", "trio-r"]),
        photos: z.array(
          z.object({
            src: z.string(),
            alt: z.string(),
            fit: z.enum(["cover", "contain"]).optional().default("cover"),
          }),
        ),
        caption: z.string().optional(),
      }),
    ),
  }),
});

export const collections = { authors, rolls, films, photoessays };
