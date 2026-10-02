import { createFileRoute } from '@tanstack/react-router'

import BlogPosts from '@/components/blog-posts'
import { listPosts } from '@/server/posts'

export const Route = createFileRoute('/category/$category')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const category = params.category
    const posts = (await listPosts()).filter((post) => post.categories.includes(category))
    return { category, posts }
  },
})

function RouteComponent() {
  const { category, posts } = Route.useLoaderData()
  return <BlogPosts title={`Notes filed under “${category}”`} posts={posts} />
}
