import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { marked } from 'marked'

import { type BlogPost, formatDate } from '@/lib/posts'
import { getPost } from '@/server/posts'

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const result = await getPost({ data: { slug: params.slug } })
    if (!result) throw notFound()
    return result
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { post, others }: { post: BlogPost; others: BlogPost[] } = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <article className="rise">
        <p className="m-0 font-pixel text-sm text-surf">// field note</p>
        <h1 className="mt-1 mb-2 font-pixel text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {post.title}
        </h1>
        <p className="mb-6 text-sm text-inksoft">{formatDate(post.date)}</p>

        {post.image && (
          <img
            src={`/.netlify/images?url=/img/${post.image}&w=900&fm=webp`}
            alt={post.title}
            width={900}
            height={483}
            className="pixelated pixel-frame pxshadow mb-8 w-full object-cover"
          />
        )}

        <div className="flex flex-wrap items-center gap-2 pb-8">
          {post.categories.map((cat: string) => (
            <Link
              key={cat}
              to="/category/$category"
              params={{ category: cat }}
              className="border-2 border-kelp bg-deep px-2 py-0.5 font-pixel text-xs text-surf no-underline transition-colors hover:bg-kelp hover:text-ink"
            >
              {cat}
            </Link>
          ))}
        </div>

        {post.content.trim() && (
          <div
            className="prose-reef"
            dangerouslySetInnerHTML={{ __html: marked(post.content) }}
          />
        )}
      </article>

      {others.length > 0 && (
        <aside className="mt-16">
          <div className="pellet-row mb-6" aria-hidden="true" />
          <h2 className="mb-4 font-pixel text-xl font-semibold text-ink">Keep reading</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {others.map((p) => (
              <Link
                key={p.slug}
                to="/posts/$slug"
                params={{ slug: p.slug }}
                className="group block no-underline"
              >
                <div className="pixel-frame bg-deep pxshadow-sm p-4 transition-colors group-hover:bg-water">
                  <h3 className="m-0 font-pixel text-lg font-semibold text-ink group-hover:text-surf">
                    {p.title}
                  </h3>
                  {p.summary && (
                    <p className="mt-1 mb-0 text-xs text-inksoft">{p.summary}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </aside>
      )}

      <div className="mt-12 text-center">
        <Link
          to="/blog"
          className="font-pixel text-surf underline underline-offset-4 hover:text-foam"
        >
          ← Back to all field notes
        </Link>
      </div>
    </div>
  )
}
