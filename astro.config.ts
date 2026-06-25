import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import UnoCSS from 'unocss/astro';
import { THEME_CONFIG } from "./src/theme.config";
import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

import mdx from "@astrojs/mdx";
import rehypeKatex from 'rehype-katex'; // relevant
import remarkMath from 'remark-math';   // relevant
import partytown from "@astrojs/partytown";

// Per-post <lastmod> for the sitemap. The dates are produced by the
// /posts-lastmod.json endpoint during the page build (keyed by the real built URLs);
// the sitemap integration's astro:build:done runs after, so the file is ready here.
let lastmodByPath: Record<string, string> | undefined;
function lastmodFor(url: string): string | undefined {
  if (!lastmodByPath) {
    try {
      lastmodByPath = JSON.parse(fs.readFileSync('./dist/posts-lastmod.json', 'utf-8'));
    } catch {
      lastmodByPath = {};
    }
  }
  return lastmodByPath[new URL(url).pathname];
}

// https://astro.build/config
export default defineConfig({
  site: THEME_CONFIG.website,
  prefetch: true,
  server: {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      langs: [],
      // false: long lines scroll horizontally instead of wrapping,
      // so code (and aligned comments) keep their layout
      wrap: false
    }
  },
  integrations: [UnoCSS({
    injectReset: true
  }), robotsTxt({
    // `*` already allows everyone; the explicit AI-engine entries document intent
    // (GEO: we welcome answer/search crawlers so the blog can be cited).
    // Delete a line to opt that crawler out (e.g. drop training/grounding bots).
    // NB: astro-robots-txt@1 wants ONE userAgent string per policy item.
    policy: [
      { userAgent: "*", allow: "/" },
      ...[
        "GPTBot", "OAI-SearchBot", "ChatGPT-User",   // OpenAI
        "ClaudeBot", "Claude-User", "anthropic-ai",  // Anthropic
        "PerplexityBot", "Perplexity-User",          // Perplexity
        "Google-Extended",                            // Gemini / AI Overviews grounding
        "Applebot-Extended",                          // Apple Intelligence
        "CCBot",                                      // Common Crawl (feeds many LLMs)
      ].map((userAgent) => ({ userAgent, allow: "/" })),
    ],
  }), sitemap({
    serialize(item) {
      const lastmod = lastmodFor(item.url);
      if (lastmod) item.lastmod = lastmod;
      return item;
    },
  }), mdx({
    remarkPlugins: [remarkMath], // relevant
    rehypePlugins: [rehypeKatex] // relevant
  }), partytown({
    // Adds dataLayer.push as a forwarding-event.
    config: {
      forward: ["dataLayer.push", "gtag"],
    },
  })]
});