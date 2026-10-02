import { useEffect, useRef, useState } from 'react'

const GAME_URL = '/game/'

type GpuState = 'checking' | 'ready' | 'unsupported' | 'failed'

type NavigatorWithGpu = Navigator & {
  gpu?: { requestAdapter(): Promise<unknown> }
}

function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined') return Promise.resolve(false)
  const nav = navigator as NavigatorWithGpu
  if (!nav.gpu) return Promise.resolve(false)
  return nav.gpu
    .requestAdapter()
    .then((a) => Boolean(a))
    .catch(() => false)
}

export default function AquariumGame() {
  const [gpu, setGpu] = useState<GpuState>('checking')
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    detectWebGPU().then((ok) => {
      if (alive) setGpu(ok ? 'ready' : 'unsupported')
    })
    const timer = window.setTimeout(() => {
      setGpu((current) => (current === 'checking' ? 'failed' : current))
    }, 4000)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [])

  const embedded = gpu === 'ready' || gpu === 'checking'

  return (
    <section className="relative mx-auto max-w-6xl px-3 pt-8 sm:px-6">
      <div className="rise">
        <div
          ref={frameRef}
          className="pixel-frame scanlines bg-water relative overflow-hidden pxshadow"
        >
          <div className="relative aspect-[16/10] w-full sm:aspect-[2/1]">
            {embedded && (
              <iframe
                src={GAME_URL}
                title="The Filter Feed — an interactive WebGPU pixel aquarium with corydoras, cherry barbs and cherry shrimp"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allow="fullscreen"
              />
            )}

            {gpu === 'checking' && (
              <div className="absolute inset-0 grid place-items-center bg-deep">
                <p className="font-pixel text-lg text-inksoft">Filling the tank…</p>
              </div>
            )}

            {gpu === 'unsupported' && (
              <div className="absolute inset-0 grid place-items-center bg-deep px-6 text-center">
                <div className="max-w-md">
                  <p className="font-pixel text-2xl font-semibold text-ink">
                    Your browser can't run the tank
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-inksoft">
                    The aquarium renders with WebGPU, which needs a recent Chrome, Edge, Firefox, or
                    Safari. Check your device at{' '}
                    <a
                      href="https://webgpureport.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-surf underline underline-offset-4"
                    >
                      webgpureport.org
                    </a>{' '}
                    — or keep exploring the tank below as pixel paintings.
                  </p>
                  <a
                    href={GAME_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block border-4 border-ink bg-kelp px-4 py-2 font-pixel text-ink no-underline pxshadow-sm transition-colors hover:bg-surf hover:text-abyss"
                  >
                    Try it in a new tab anyway
                  </a>
                </div>
              </div>
            )}

            {gpu === 'failed' && (
              <div className="absolute inset-0 grid place-items-center bg-deep px-6 text-center">
                <div className="max-w-md">
                  <p className="font-pixel text-2xl font-semibold text-ink">
                    The tank is taking a while
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-inksoft">
                    Something stalled while starting the GPU. Reload the page, or open the tank on
                    its own — it runs better full-size.
                  </p>
                  <a
                    href={GAME_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block border-4 border-ink bg-kelp px-4 py-2 font-pixel text-ink no-underline pxshadow-sm transition-colors hover:bg-surf hover:text-abyss"
                  >
                    Open the aquarium
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="m-0 font-pixel text-2xl font-semibold text-ink sm:text-3xl">
              The Filter Feed
              <span className="blink text-surf" aria-hidden="true" />
            </h1>
            <p className="mt-1 text-sm text-inksoft">
              An interactive community tank of banded corydoras, cherry barbs and cherry shrimp, rendered live in
              WebGPU — my fishkeeping notes live just below the waterline.
            </p>
          </div>
          <a
            href={GAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 self-start border-4 border-ink bg-clay px-4 py-2 font-pixel text-ink no-underline pxshadow-sm transition-colors hover:bg-surf hover:text-abyss sm:self-auto"
          >
            Fullscreen tank ↗
          </a>
        </div>
      </div>
    </section>
  )
}
