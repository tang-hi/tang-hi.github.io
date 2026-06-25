import type { APIContext } from 'astro'
import { getPosts, getPostDescription } from '~/utils'
import { THEME_CONFIG } from '~/theme.config'

// /llms.txt — a plain-markdown index of the site for LLM answer engines.
// Convention: https://llmstxt.org/  (a concise, link-rich map of the content).
export async function GET(_context: APIContext) {
  const { title, desc, website, author } = THEME_CONFIG
  const posts = await getPosts()

  const lines: string[] = []
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(`> ${desc}`)
  lines.push('')
  lines.push(
    `Personal blog by ${author}, covering databases, search engines, vector search, C++, and systems internals. Some posts are available in both Chinese and English.`,
  )
  lines.push('')
  lines.push('## Posts')
  lines.push('')
  for (const post of posts) {
    const url = new URL(`/posts/${post.slug}/`, website).toString()
    const summary = (getPostDescription(post) || '').replace(/\s+/g, ' ').trim().slice(0, 200)
    lines.push(`- [${post.data.title}](${url})${summary ? `: ${summary}` : ''}`)
  }
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
