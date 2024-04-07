import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
    const posts = await getCollection("posts");
    return rss({
        stylesheet: '/rss/rss.xsl',
        title: 'Posts',
        description: 'Photography Blog Posts - 120 Shots.',
        site: context.site,
        items: posts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/posts/${post.slug}/`,
            content: sanitizeHtml(parser.render(post.body)),
            author: post.author
        })),
        customData: `<language>en-us</language>`,
    });
}