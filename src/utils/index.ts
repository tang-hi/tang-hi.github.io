import { getCollection } from 'astro:content'
import sanitizeHtml from 'sanitize-html'
import MarkdownIt from 'markdown-it'

/** The language shown by default in listings, archive, RSS and canonical URLs. */
export const PRIMARY_LANG = 'zh'

/** A post's language, falling back to the primary language when not declared. */
export function getLang(post: Post) {
  return post.data.lang ?? PRIMARY_LANG
}

/**
 * A secondary translation is a non-primary-language variant of a post that also
 * exists in the primary language (linked via `translationKey`). These are reached
 * through the in-page language toggle, so we keep them out of the global listings.
 */
export function isSecondaryTranslation(post: Post) {
  return Boolean(post.data.translationKey) && getLang(post) !== PRIMARY_LANG
}

/** Find the sibling post in another language that shares the same `translationKey`. */
export function getTranslation(post: Post, posts: Post[]) {
  const key = post.data.translationKey
  if (!key) return undefined
  return posts.find(p => p.slug !== post.slug && p.data.translationKey === key)
}

export async function getCategories() {
  const posts = await getPosts()

  const categories = new Map<string, Post[]>()

  posts.forEach((post) => {
    if (post.data.categories) {
      post.data.categories.forEach((c) => {
        const posts = categories.get(c) || []
        posts.push(post)
        categories.set(c, posts)
      })
    }
  })

  return categories
}

export async function getAllPosts() {
  const posts = await getCollection('posts')
  posts.sort((a, b) => {
    const aDate = a.data.pubDate || new Date()
    const bDate = b.data.pubDate || new Date()
    return -1 * (aDate.getTime() - bDate.getTime())
  })
  return posts
}

export async function getPosts() {
  const posts = await getAllPosts()
  const visiblePosts = posts.filter(post =>  !isSecondaryTranslation(post) && !(post.data.categories && (post.data.categories.includes('annual-review') || post.data.categories.includes('notes'))));
  return visiblePosts
}

export async function getNotes() {
  const posts = await getAllPosts()
  const notes = posts.filter(post => post.data.categories && post.data.categories.includes('notes'));
  return notes
}

const parser = new MarkdownIt()

export function getPostDescription(post: Post) {
  if (post.data.description) {
    return post.data.description
  }

  const html = parser.render(post.body)
  const sanitized = sanitizeHtml(html, { allowedTags: [] })
  return sanitized.slice(0, 400)
}

export function formatDate(date?: Date) {
  if(!date) return '--'
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getPathFromCategory(category: string, category_map: {name: string, path: string}[]) {
  const mappingPath = category_map.find(l => l.name === category)
  return mappingPath ? mappingPath.path : category
}