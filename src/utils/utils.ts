import fs from "fs";
import sanitize from "sanitize-filename";
import path from "path";

export const getRandomString = (length?: number) => {
  return Math.ceil(Math.random() * 10 ** 9)
    .toString(16)
    .slice(-(length || 6))
    .toUpperCase();
};

export const slugify = (text: string) => {
  return sanitize(text).toLowerCase().trim().replace(/\s+/g, "-");
};

export const createNewPost = (
  imageURLs: string[],
  postTitle?: string,
  frontMatterParameters?: {},
) => {
  const now = new Date();
  const title = postTitle || "Draft post";
  const fileName =
    sanitize(now.toISOString().split("T")[0] + "-" + title) + ".mdx";
  const filePath = path.normalize("./src/content/posts/") + fileName;

  const textContent = `---
title: ${title}
slug: ${slugify(title)}
pubDate: ${now.toISOString()}
updatedDate: ${now.toISOString()}
tags: []
author: paskal
image:
  {
    src: ${imageURLs[Math.floor(Math.random() * imageURLs.length)]},
    alt: "alt text",
    positionx: 50%,
    positiony: 50%,
  }
description: ""
${frontMatterParameters ? Object.entries(frontMatterParameters).map(([key, value]) => `${key}: ${JSON.stringify(value)}\n`) : ""}
---
Post content goes here

import MasonryLayout from "../../components/Masonry.astro";

<MasonryLayout
  images={
    [
    ${imageURLs.map((url) => `{ src: "${url}", alt: "alt text" }\n`)}
    ]
  }
/>`;

  return fs.promises.writeFile(filePath, textContent).then(() => filePath);
};
