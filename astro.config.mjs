import { defineConfig, passthroughImageService } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import markdoc from "@astrojs/markdoc";
import remarkGfm from "remark-gfm";
import { remarkReadingTime } from "./src/scripts/remark-reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://www.120shots.com",
  image: {
    domains: ["120shots.com", "cdn.120shots.com"],
    service: passthroughImageService(),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.120shots.com",
      },
    ],
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
    tailwind(),
    markdoc(),
  ],
  markdown: {
    remarkPlugins: [remarkGfm, remarkReadingTime],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  experimental: {
    clientPrerender: true,
    // directRenderScript: true
  },
});
