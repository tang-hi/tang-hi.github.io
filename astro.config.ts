import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
import { THEME_CONFIG } from "./src/theme.config";
import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

import mdx from "@astrojs/mdx";
import rehypeKatex from 'rehype-katex'; // relevant
import remarkMath from 'remark-math';   // relevant
import partytown from "@astrojs/partytown";

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
      wrap: true
    }
  },
  integrations: [UnoCSS({
    injectReset: true
  }), robotsTxt(), sitemap(), mdx({
    remarkPlugins: [remarkMath], // relevant
    rehypePlugins: [rehypeKatex] // relevant
  }), partytown({
    // Adds dataLayer.push as a forwarding-event.
    config: {
      forward: ["dataLayer.push"],
    },
  })]
});