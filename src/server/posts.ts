import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { allPosts } from 'content-collections'

import { db } from '../../db/index.js'
import { posts } from '../../db/schema.js'
import { type BlogPost, slugify, sortByDate } from '@/lib/posts'
import { requireEditor } from './auth'

async function loadRows() {
  try {
    return await db.select().from(posts)
  } catch (err) {
    // Keep the public blog up with the markdown posts if the database is unreachable.
    console.error('Could not load posts from the database', err)
    return []
  }
}

async function loadAll(): Promise<BlogPost[]> {
  const rows = await loadRows()
  const bySlug = new Map<string, BlogPost>()

  for (const p of allPosts) {
    bySlug.set(p.slug, {
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      categories: p.categories,
      image: p.image,
      date: p.date,
      content: p.content,
      published: true,
      source: 'file',
      filePath: `content/posts/${p._meta.filePath}`,
    })
  }
  for (const r of rows) {
    bySlug.set(r.slug, {
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      categories: r.categories,
      image: r.image,
      date: r.date,
      content: r.content,
      published: r.published,
      source: bySlug.has(r.slug) ? 'edited' : 'db',
    })
  }
  return sortByDate([...bySlug.values()])
}

export const listPosts = createServerFn({ method: 'GET' }).handler(async () => {
  return (await loadAll()).filter((p) => p.published)
})

export const getPost = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const all = await loadAll()
    const post = all.find((p) => p.slug === data.slug && p.published)
    if (!post) return null
    const others = all.filter((p) => p.published && p.slug !== post.slug).slice(0, 2)
    return { post, others }
  })

// Editor-only: every post including drafts.
export const listAllPosts = createServerFn({ method: 'GET' }).handler(async () => {
  await requireEditor()
  return loadAll()
})

export const getPostForEdit = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    await requireEditor()
    return (await loadAll()).find((p) => p.slug === data.slug) ?? null
  })

const postInput = z.object({
  // Present when editing an existing post; slugs never change after creation.
  slug: z.string().optional(),
  title: z.string().trim().min(1, 'Give the note a title').max(200),
  summary: z.string().max(500),
  categories: z.array(z.string().trim().min(1).max(40)).max(10),
  image: z.string().max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date'),
  content: z.string().max(200_000),
  published: z.boolean(),
})

export const savePost = createServerFn({ method: 'POST' })
  .validator(postInput)
  .handler(async ({ data }) => {
    await requireEditor()
    const { slug: existing, ...fields } = data
    const values = { ...fields, updatedAt: new Date() }

    if (existing) {
      await db
        .insert(posts)
        .values({ slug: existing, ...values })
        .onConflictDoUpdate({ target: posts.slug, set: values })
      return { slug: existing }
    }

    const base = slugify(fields.title) || 'note'
    const taken = new Set((await loadAll()).map((p) => p.slug))
    let slug = base
    for (let n = 2; taken.has(slug); n++) slug = `${base}_${n}`

    await db.insert(posts).values({ slug, ...values })
    return { slug }
  })

// Deletes the DB row. For a markdown-backed post this reverts it to the file
// version; editor-only posts are removed entirely.
export const deletePost = createServerFn({ method: 'POST' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    await requireEditor()
    await db.delete(posts).where(eq(posts.slug, data.slug))
    return { ok: true }
  })
