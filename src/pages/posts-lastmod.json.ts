import type { APIContext } from 'astro'
import { getAllPosts } from '~/utils'

// Build-time data file consumed by the sitemap integration's `serialize` hook
// (see astro.config.ts) to stamp an accurate per-post <lastmod>. Astro auto-slugifies
// paths (e.g. `C++` -> `c`), so we emit the exact built URLs here — where getCollection
// knows the real slugs — instead of trying to reproduce the slug logic inside the config.
export async function GET(_context: APIContext) {
  const posts = await getAllPosts()
  const byPath: Record<string, string> = {}
  for (const post of posts) {
    byPath[`/posts/${post.slug}/`] = (post.data.pubDate ?? new Date()).toISOString()
  }
  return new Response(JSON.stringify(byPath), {
    headers: { 'Content-Type': 'application/json' },
  })
}
