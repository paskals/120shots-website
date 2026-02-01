import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const essays = await getCollection("photoessays");
  return rss({
    stylesheet: "/rss/rss.xsl",
    title: "Photo Essays - 120 Shots",
    description: "Visual stories told through photography - 120 Shots.",
    site: context.site,
    items: essays.map((essay) => ({
      title: essay.data.title,
      pubDate: essay.data.pubDate,
      description: essay.data.description,
      link: `/essays/${essay.id}/`,
      author: essay.data.author?.id,
    })),
    customData: `<language>en-us</language>`,
  });
}
