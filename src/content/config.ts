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

export const collections = { posts: blog, authors, films };
