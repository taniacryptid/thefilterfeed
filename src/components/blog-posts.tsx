import { Link } from '@tanstack/react-router'

import { type BlogPost, formatDate, sortByDate } from '@/lib/posts'

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="pixel-frame bg-deep pxshadow-sm group h-full transition-all duration-200 hover:-translate-y-1 hover:bg-water">
      {post.image && (
        <Link to="/posts/$slug" params={{ slug: post.slug }} className="block">
          <img
            src={`/.netlify/images?url=/img/${post.image}&w=680&fm=webp`}
            alt={post.title}
            width={680}
            height={364}
            loading="lazy"
            className="pixelated aspect-[120/64] w-full border-b-4 border-ink object-cover"
          />
        </Link>
      )}
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {post.categories.map((cat: string) => (
            <Link
              key={cat}
              to="/category/$category"
              params={{ category: cat }}
              className="border-2 border-kelp bg-abyss px-2 py-0.5 font-pixel text-xs text-surf no-underline transition-colors hover:bg-kelp hover:text-ink"
            >
              {cat}
            </Link>
          ))}
        </div>
        <h3 className="mt-3 mb-1 font-pixel text-xl font-semibold leading-snug">
          <Link
            to="/posts/$slug"
            params={{ slug: post.slug }}
            className="text-ink no-underline transition-colors group-hover:text-sandbright"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-xs text-inksoft">{formatDate(post.date)}</p>
        {post.summary && (
          <p className="mt-2 text-sm leading-relaxed text-foam">{post.summary}</p>
        )}
        <Link
          to="/posts/$slug"
          params={{ slug: post.slug }}
          className="mt-3 inline-block font-pixel text-sm text-clay no-underline transition-colors hover:text-surf"
        >
          Read the note →
        </Link>
      </div>
    </article>
  )
}

export default function BlogPosts({
  title,
  posts,
}: {
  title: string
  posts: BlogPost[]
}) {
  const sorted = sortByDate(posts)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rise">
        <p className="m-0 font-pixel text-sm text-surf">// fishkeeping log</p>
        <h1 className="mt-1 mb-8 font-pixel text-3xl font-semibold text-ink sm:text-4xl">
          {title}
        </h1>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {sorted.map((post, i) => (
          <div key={post.slug} className={i % 2 === 0 ? 'rise rise-2' : 'rise rise-3'}>
            <PostCard post={post} />
          </div>
        ))}
      </div>
      {sorted.length === 0 && (
        <div className="pixel-frame bg-deep pxshadow p-8 text-center">
          <p className="m-0 font-pixel text-lg text-ink">No notes in this drawer yet</p>
          <p className="mt-2 text-sm text-inksoft">
            The fish are still swimming — check back after the next water change.
          </p>
        </div>
      )}
    </div>
  )
}
