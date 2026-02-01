import { defineConfig, passthroughImageService } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import markdoc from "@astrojs/markdoc";
import remarkGfm from "remark-gfm";
import { remarkReadingTime } from "./src/scripts/remark-reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://120shots.com",
  redirects: {
    "/about": "/authors/paskal",
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: {
        theme: "dracula",
      },
      gfm: false,
    }),
    markdoc(),
    icon({
      include: {
        mdi: ["*"],
        bi: ["*"],
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkGfm, remarkReadingTime],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
