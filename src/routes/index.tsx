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
          <div className="pixel-frame bg-deep pxshadow p-6 sm:p-8">
            <p className="m-0 font-pixel text-lg text-ink">
              Tip: tap the water to drop food. The cherry barbs snap it up mid-water, the corys sift
              the sand for whatever sinks, and the shrimp pick at it slowly. Use the fish buttons in the tank to choose who's swimming.
            </p>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-inksoft">
              The tank runs entirely on your GPU — every fish, plant, and bubble is drawn per-pixel
              in a WebGPU shader. No WebGPU? The frame tells you why, and the field notes below are
              the next best thing.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
