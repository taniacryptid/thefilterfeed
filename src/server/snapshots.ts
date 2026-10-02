import { createServerFn } from '@tanstack/react-start'
import { getStore } from '@netlify/blobs'
import { z } from 'zod'

import { HEADER_HEIGHT, HEADER_WIDTH, SNAPSHOT_PREFIX } from '@/lib/posts'
import { requireEditor } from './auth'

// Header snapshots captured from the live tank in the editor. Served publicly
// by netlify/functions/snapshot.mts at /snapshots/<key>.
export const SNAPSHOT_STORE = 'header-snapshots'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

// Only accept real PNGs at exactly the header size, so every snapshot in the
// library fits the post header without cropping.
function checkPng(bytes: Uint8Array) {
  if (bytes.length < 24 || PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) {
    throw new Error('That snapshot is not a PNG.')
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  if (width !== HEADER_WIDTH || height !== HEADER_HEIGHT) {
    throw new Error(`Snapshots must be ${HEADER_WIDTH}x${HEADER_HEIGHT}.`)
  }
}

// Newest first: keys start with a timestamp.
export const listSnapshots = createServerFn({ method: 'GET' }).handler(async () => {
  await requireEditor()
  const { blobs } = await getStore(SNAPSHOT_STORE).list()
  return blobs
    .map((b) => SNAPSHOT_PREFIX + b.key)
    .sort()
    .reverse()
})

export const uploadSnapshot = createServerFn({ method: 'POST' })
  // base64 PNG; a 1200x640 pixel-art frame is well under this.
  .validator(z.object({ png: z.string().min(1).max(4_000_000) }))
  .handler(async ({ data }) => {
    await requireEditor()
    const bytes = Uint8Array.from(Buffer.from(data.png, 'base64'))
    checkPng(bytes)
    const key = `${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}-${crypto.randomUUID().slice(0, 8)}.png`
    await getStore(SNAPSHOT_STORE).set(key, bytes.buffer as ArrayBuffer)
    return { image: SNAPSHOT_PREFIX + key }
  })

export const deleteSnapshot = createServerFn({ method: 'POST' })
  .validator(z.object({ image: z.string().startsWith(SNAPSHOT_PREFIX) }))
  .handler(async ({ data }) => {
    await requireEditor()
    await getStore(SNAPSHOT_STORE).delete(data.image.slice(SNAPSHOT_PREFIX.length))
    return { ok: true }
  })
