import { getStore } from '@netlify/blobs'

// Serves header snapshots saved from the editor (src/server/snapshots.ts) so
// the Image CDN can resize them like the files in public/img/.
export default async (_req: Request, context: { params: Record<string, string> }) => {
  const key = context.params.key
  if (!/^[\w-]+\.png$/.test(key)) return new Response('Not found', { status: 404 })
  const data = await getStore('header-snapshots').get(key, { type: 'arrayBuffer' })
  if (!data) return new Response('Not found', { status: 404 })
  return new Response(data, {
    headers: {
      'Content-Type': 'image/png',
      // Keys are unique per capture, so the bytes never change.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

export const config = { path: '/snapshots/:key' }
