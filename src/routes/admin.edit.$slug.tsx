import { createFileRoute, notFound } from '@tanstack/react-router'

import PostEditor from '@/components/PostEditor'
import { type BlogPost } from '@/lib/posts'
import { getPostForEdit } from '@/server/posts'

export const Route = createFileRoute('/admin/edit/$slug')({
  loader: async ({ params }) => {
    const post = await getPostForEdit({ data: { slug: params.slug } })
    if (!post) throw notFound()
    return post
  },
  component: RouteComponent,
})

function RouteComponent() {
  const post: BlogPost = Route.useLoaderData()
  // Remount when switching between posts so the form resets.
  return <PostEditor key={post.slug} post={post} />
}
