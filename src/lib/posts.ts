// Shared shape for a field note, whether it comes from a markdown file in
// content/posts/ or from the database (written in the in-site editor).
export type BlogPost = {
  slug: string
  title: string
  summary: string
  categories: string[]
  image: string
  date: string
  content: string
  published: boolean
  // 'file' = markdown only, 'edited' = markdown overridden by a DB row, 'db' = DB only.
  source: 'file' | 'edited' | 'db'
}

// Same transform content-collections.ts uses, so new posts get familiar URLs.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function sortByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1))
}

// Snapshot images available in public/img/ (rendered by scripts/snapshot-creatures.ts).
export const POST_IMAGES = [
  'corydoras-pair.png',
  'planted-tank.png',
  'sand-sifting.png',
  'water-change.png',
]

// Post header size: the snapshot script and the editor's tank camera both
// render at exactly this, and cards/detail pages crop to the same 15:8 ratio.
export const HEADER_WIDTH = 1200
export const HEADER_HEIGHT = 640

// Images captured in the editor live in Netlify Blobs and are stored on posts
// as "snapshots/<key>.png"; anything else is a filename in public/img/.
export const SNAPSHOT_PREFIX = 'snapshots/'

export function postImageSrc(image: string, width: number): string {
  const path = image.startsWith(SNAPSHOT_PREFIX) ? `/${image}` : `/img/${image}`
  return `/.netlify/images?url=${path}&w=${width}&fm=webp`
}

export function formatDate(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
