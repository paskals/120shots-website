// 1. Import utilities from `astro:content`
import { z, defineCollection, reference } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    author: reference("authors"),
    description: z.string(),
    filmStocks: z.array(reference("films")).optional(),
    rolls: z.array(reference("rolls")).optional(),
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

const films = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    color: z.enum([
      "color-negative",
      "color-positive",
      "black-and-white-negative",
      "special-negative",
    ]),
    iso: z.string(),
    description: z.string().optional(),
  }),
});

const rolls = defineCollection({
  type: "data",
  schema: z.object({
    film: reference("films"),
    camera: z.string().optional(),
    format: z.enum(["half-frame", "35mm", "6x6", "6x7", "6x8", "6x9", "4x5"]),
    description: z.string().optional(),
    cover: z.string().optional(),
    shots: z.array(
      z.object({
        sequence: z.coerce.string(),
        date: z.coerce.date().optional(),
        offsetTime: z.string().optional(),
        hidden: z.coerce.boolean().optional(), // for shots that are not to be displayed
        portfolio: z.enum(["landscape", "street", "panorama", "portrait"]).optional(),
        image: z.object({
          src: z.string(),
          alt: z.string(),
          positionx: z.string().optional(),
          positiony: z.string().optional(),
        }),
      }),
    ),
  }),
});

const authors = defineCollection({
  type: "content",
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

export const collections = { posts: blog, authors, rolls, films };
