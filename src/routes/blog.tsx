import { createFileRoute } from '@tanstack/react-router'

import BlogPosts from '@/components/blog-posts'
import { listPosts } from '@/server/posts'

export const Route = createFileRoute('/blog')({
  loader: () => listPosts(),
  component: RouteComponent,
})

function RouteComponent() {
  const posts = Route.useLoaderData()
  return <BlogPosts title="Field Notes" posts={posts} />
}
