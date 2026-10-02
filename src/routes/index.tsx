import { Link, createFileRoute } from '@tanstack/react-router'

import AquariumGame from '@/components/AquariumGame'
import { PostCard } from '@/components/blog-posts'
import { type BlogPost } from '@/lib/posts'
import { listPosts } from '@/server/posts'

export const Route = createFileRoute('/')({
  loader: () => listPosts(),
  component: App,
})

function App() {
  const recent = (Route.useLoaderData() as BlogPost[]).slice(0, 2)

  return (
    <main>
      <AquariumGame />

      <section className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
        <div className="rise rise-2">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-pixel text-2xl font-semibold text-ink sm:text-3xl">
              Latest from the log
            </h2>
            <Link
              to="/blog"
              className="font-pixel text-sm text-surf no-underline hover:text-foam sm:text-base"
            >
              All field notes →
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {recent.map((post, i) => (
                <div key={post.slug} className={i === 0 ? 'rise rise-2' : 'rise rise-3'}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <p className="font-pixel text-inksoft">
              The log is empty — new notes are being written at the tank.
            </p>
          )}
        </div>

        <div className="rise rise-3 mt-14">
          <div className="border-2 border-kelp/40 bg-deep/60 p-4 sm:p-5">
            <p className="m-0 font-pixel text-sm leading-relaxed text-ink sm:text-base">
              Tip: tap the water to drop food, and the fish will start eating it. The cherry barbs will
              start eating mid-water, the corydoras will sift the sand for whatever sinks, and the shrimp
              will be the slow boys picking at what's left, slowly. You can also toggle the fish buttons
              to choose who is swimming.
            </p>
            <p className="mt-2 mb-0 text-xs leading-relaxed text-inksoft">
              The tank runs entirely on your GPU, drawn per-pixel in a WebGPU shader. If it doesn't
              load, the frame will tell you why. You can also check my personal blog posts on
              fishkeeping below!
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
