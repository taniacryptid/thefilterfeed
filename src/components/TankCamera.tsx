import { useEffect, useRef, useState } from 'react'

import { HEADER_HEIGHT, HEADER_WIDTH } from '@/lib/posts'
import { uploadSnapshot } from '@/server/snapshots'

// The game in snapshot mode renders at exactly the post-header size, so what
// the editor sees in this frame is what the header gets.
const SNAP_URL = '/game/?snap'

type SnapWindow = Window & { snapTank?: () => Promise<Blob | null> }

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function TankCamera({
  onSaved,
  onClose,
}: {
  onSaved: (image: string) => void
  onClose: () => void
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  useEffect(() => {
    if (!shot) return
    return () => URL.revokeObjectURL(shot.url)
  }, [shot])

  async function snap() {
    setError('')
    const snapTank = (frameRef.current?.contentWindow as SnapWindow | null)?.snapTank
    if (!snapTank) {
      setError('The tank is still filling (or WebGPU is unavailable) — try again in a moment.')
      return
    }
    const blob = await snapTank()
    if (!blob) return setError('Could not read the frame from the GPU. Try again.')
    setShot({ blob, url: URL.createObjectURL(blob) })
  }

  async function save() {
    if (!shot) return
    setBusy(true)
    setError('')
    try {
      const { image } = await uploadSnapshot({ data: { png: await toBase64(shot.blob) } })
      onSaved(image)
    } catch (e) {
      setError(e instanceof Error && e.message !== 'Not authorized' ? e.message : 'Your session expired — log in again.')
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Snap a post header from the tank"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-abyss/85 p-4"
    >
      <div className="pixel-frame bg-deep pxshadow w-full max-w-4xl p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="m-0 font-pixel text-lg font-semibold text-ink">Snap a header</p>
            <p className="m-0 mt-1 text-xs text-inksoft">
              Pose the tank — feed it, drop a lolly, toggle species — then take the shot. The frame is
              exactly the header size ({HEADER_WIDTH}×{HEADER_HEIGHT}); the buttons aren't captured.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="btn-px-ghost shrink-0">
            Close
          </button>
        </div>

        <div className="relative aspect-[120/64] w-full border-4 border-ink bg-water">
          <iframe
            ref={frameRef}
            src={SNAP_URL}
            title="Live tank for header snapshots"
            className="absolute inset-0 h-full w-full border-0"
          />
          {shot && (
            <img
              src={shot.url}
              alt="Captured header snapshot"
              className="pixelated absolute inset-0 h-full w-full"
            />
          )}
        </div>

        {error && <p className="m-0 mt-3 border-2 border-clay bg-abyss px-3 py-2 text-sm text-clay">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {shot ? (
            <>
              <button type="button" onClick={save} disabled={busy} className="btn-px">
                {busy ? 'Saving…' : 'Use as header'}
              </button>
              <button type="button" onClick={() => setShot(null)} disabled={busy} className="btn-px-ghost">
                Retake
              </button>
            </>
          ) : (
            <button type="button" onClick={snap} className="btn-px">
              Take snapshot
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
