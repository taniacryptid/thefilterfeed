import { Link, createFileRoute } from '@tanstack/react-router'
import { logout } from '@netlify/identity'

import { type BlogPost, formatDate } from '@/lib/posts'
import { type Editor } from '@/server/auth'
import { listAllPosts } from '@/server/posts'

export const Route = createFileRoute('/admin/')({
  loader: () => listAllPosts(),
  component: Dashboard,
})

function Dashboard() {
  const posts: BlogPost[] = Route.useLoaderData()
  const { editor }: { editor: Editor } = Route.useRouteContext()

  const signOut = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rise mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 font-pixel text-sm text-surf">// signed in as {editor.email}</p>
          <h1 className="mt-1 mb-0 font-pixel text-3xl font-semibold text-ink sm:text-4xl">
            Editor's desk
          </h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={signOut} className="btn-px-ghost">
            Log out
          </button>
          <Link to="/admin/new" className="btn-px">
            + New field note
          </Link>
        </div>
      </div>

      <div className="rise rise-2 pixel-frame bg-deep pxshadow">
        {posts.length === 0 && (
          <p className="m-0 p-8 text-center font-pixel text-inksoft">No notes yet — write the first one.</p>
        )}
        <ul className="m-0 list-none divide-y-2 divide-kelp p-0">
          {posts.map((post) => (
            <li key={post.slug} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link
                  to="/admin/edit/$slug"
                  params={{ slug: post.slug }}
                  className="font-pixel text-lg font-semibold text-ink no-underline hover:text-surf"
                >
                  {post.title}
                </Link>
                <p className="m-0 mt-1 text-xs text-inksoft">
                  {formatDate(post.date)}
                  {post.categories.length > 0 && <> · {post.categories.join(', ')}</>}
                </p>
              </div>
              <span
                className={
                  post.published
                    ? 'border-2 border-kelp bg-abyss px-2 py-0.5 font-pixel text-xs text-surf'
                    : 'border-2 border-sand bg-abyss px-2 py-0.5 font-pixel text-xs text-sand'
                }
              >
                {post.published ? 'Published' : 'Draft'}
              </span>
              <div className="flex gap-3 font-pixel text-sm">
                {post.published && (
                  <Link to="/posts/$slug" params={{ slug: post.slug }} className="text-inksoft hover:text-ink">
                    View
                  </Link>
                )}
                <Link to="/admin/edit/$slug" params={{ slug: post.slug }} className="text-clay hover:text-surf">
                  Edit →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
