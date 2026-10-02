// Renders still "snapshots" of the aquarium's creatures with WebGPU, using the exact sprite and
// WGSL shader from public/game/index.html, and writes them to public/img/ as blog images.
//
//   deno run --unstable-webgpu -A scripts/snapshot-creatures.ts
//
// Each scene poses the fish/bubbles/food by hand instead of running the simulation, so the
// output is deterministic. Output is 1200x640 (matches the 120:64 card aspect).

const html = await Deno.readTextFile(new URL('../public/game/index.html', import.meta.url))
const src = html.slice(html.indexOf('const SPRITE'), html.indexOf('const canvas ='))
const { SH, WGSL, MAX_FISH, U_BUB, U_FOOD, U_VEC4, buildSprites } = new Function(
  `${src}; return { SH, WGSL, MAX_FISH, U_BUB, U_FOOD, U_VEC4, buildSprites };`,
)() as {
  SH: number
  WGSL: string
  MAX_FISH: number
  U_BUB: number
  U_FOOD: number
  U_VEC4: number
  buildSprites: () => Uint32Array
}

// corydoras sit on the sand (h lifts them); cherry barbs ('barb' / 'barb-f') are placed by y
type Fish = {
  x: number
  z: number
  dir: 1 | -1
  species?: 'cory' | 'barb' | 'barb-f'
  y?: number
  h?: number
  bob?: number
  phase?: number
  amp?: number
}
type Bubble = { x: number; y: number; r: number; z: number }
type Food = { x: number; y: number; z: number }
type Scene = {
  file: string
  scale: number // virtual pixel size; 1200/scale and 640/scale must be whole numbers
  t: number // shader time: drives water rays, plant sway and sand caustics
  fish: Fish[]
  bubbles?: Bubble[]
  food?: Food[]
}

const W = 1200
const H = 640

const SCENES: Scene[] = [
  {
    // three corys under the grass, one cruising up through the water column
    file: 'planted-tank.png',
    scale: 5,
    t: 3.2,
    fish: [
      { x: 18, z: 0.75, dir: 1, phase: 1.2, amp: 0.25 },
      { x: 150, z: 0.45, dir: -1, h: 26, phase: 4.1, amp: 1.0 },
      { x: 92, z: 0.1, dir: 1, phase: 2.6, amp: 0.3 },
    ],
    bubbles: [
      { x: 60, y: 40, r: 2, z: 0.6 },
      { x: 63, y: 22, r: 1, z: 0.6 },
    ],
  },
  {
    // a loose group nose-down in the sand, sifting
    file: 'sand-sifting.png',
    scale: 5,
    t: 7.7,
    fish: [
      { x: 140, z: 0.85, dir: -1, bob: 1, phase: 0.4, amp: 0.18 },
      { x: 30, z: 0.55, dir: 1, bob: 1, phase: 2.0, amp: 0.18 },
      { x: 96, z: 0.3, dir: -1, phase: 5.3, amp: 0.18 },
      { x: 170, z: 0.05, dir: -1, bob: 1, phase: 3.1, amp: 0.18 },
    ],
    bubbles: [
      { x: 118, y: 88, r: 1, z: 0.4 },
      { x: 122, y: 70, r: 1, z: 0.4 },
    ],
  },
  {
    // close-up pair resting beside a sponge filter's bubble stream
    file: 'corydoras-pair.png',
    scale: 8,
    t: 12.4,
    fish: [
      { x: 6, z: 0.55, dir: 1, phase: 1.8, amp: 0.2 },
      { x: 62, z: 0.1, dir: -1, phase: 4.4, amp: 0.35 },
    ],
    bubbles: [
      { x: 128, y: 40, r: 2, z: 0.5 },
      { x: 130, y: 31, r: 1, z: 0.5 },
      { x: 127, y: 23, r: 2, z: 0.5 },
      { x: 129, y: 14, r: 1, z: 0.5 },
      { x: 131, y: 6, r: 2, z: 0.5 },
    ],
  },
  {
    // feeding time: pellets sinking, corys converging on them
    file: 'water-change.png',
    scale: 5,
    t: 18.9,
    fish: [
      { x: 22, z: 0.7, dir: 1, phase: 2.2, amp: 0.9 },
      { x: 168, z: 0.4, dir: -1, phase: 0.9, amp: 0.9 },
      { x: 100, z: 0.15, dir: 1, h: 8, phase: 3.7, amp: 1.1 },
    ],
    food: [
      { x: 112, y: 38, z: 0.3 },
      { x: 120, y: 52, z: 0.5 },
      { x: 106, y: 61, z: 0.2 },
      { x: 128, y: 30, z: 0.6 },
      { x: 92, y: 110, z: 0.6 },
    ],
  },
]

const adapter = await navigator.gpu.requestAdapter()
if (!adapter) throw new Error('No WebGPU adapter available')
const device = await adapter.requestDevice()

const module = device.createShaderModule({ code: WGSL })
const format: GPUTextureFormat = 'rgba8unorm'
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: { module, entryPoint: 'vs' },
  fragment: { module, entryPoint: 'fs', targets: [{ format }] },
  primitive: { topology: 'triangle-list' },
})

const spriteData = buildSprites()
const spriteBuf = device.createBuffer({ size: spriteData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
device.queue.writeBuffer(spriteBuf, 0, spriteData)

const uData = new Float32Array(U_VEC4 * 4)
const uBuf = device.createBuffer({ size: uData.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
const bind = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: uBuf } }, { binding: 1, resource: { buffer: spriteBuf } }],
})

const target = device.createTexture({ size: [W, H], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
const bytesPerRow = Math.ceil((W * 4) / 256) * 256
const readBuf = device.createBuffer({ size: bytesPerRow * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })

for (const scene of SCENES) {
  // same virtual pixel space as the game's resize()
  const vw = W / scene.scale
  const vh = H / scene.scale
  if (vw % 1 || vh % 1) throw new Error(`${scene.file}: scale must divide ${W}x${H}`)
  const top = Math.round(vh - Math.max(34, vh * 0.26))
  const floorY = (z: number) => vh - 4 - z * (vh - 4 - top - 6)

  uData.fill(0)
  uData.set([scene.t, scene.scale, vw, vh], 0)
  const fish = scene.fish.slice(0, MAX_FISH).sort((a, b) => b.z - a.z)
  const bubbles = scene.bubbles ?? []
  const food = scene.food ?? []
  uData.set([fish.length, bubbles.length, food.length, top], 4)
  fish.forEach((f, i) => {
    const species = f.species === 'barb' ? 1 : f.species === 'barb-f' ? 2 : 0
    const y = species ? Math.round(f.y ?? 0) : Math.round(floorY(f.z) - SH + 2 - (f.h ?? 0) + (f.bob ?? 0))
    uData.set([Math.round(f.x), y, f.dir, f.z], 8 + i * 8)
    uData.set([f.phase ?? 0, f.amp ?? 0.18, Math.round(floorY(f.z)), species], 12 + i * 8)
  })
  bubbles.forEach((b, i) => uData.set([b.x, b.y, b.r, b.z], U_BUB * 4 + i * 4))
  food.forEach((p, i) => uData.set([p.x, p.y, p.z, 0], U_FOOD * 4 + i * 4))
  device.queue.writeBuffer(uBuf, 0, uData)

  const enc = device.createCommandEncoder()
  const pass = enc.beginRenderPass({
    colorAttachments: [{ view: target.createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
  })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bind)
  pass.draw(3)
  pass.end()
  enc.copyTextureToBuffer({ texture: target }, { buffer: readBuf, bytesPerRow }, [W, H])
  device.queue.submit([enc.finish()])

  await readBuf.mapAsync(GPUMapMode.READ)
  const padded = new Uint8Array(readBuf.getMappedRange())
  const rgba = new Uint8Array(W * H * 4)
  for (let y = 0; y < H; y++) rgba.set(padded.subarray(y * bytesPerRow, y * bytesPerRow + W * 4), y * W * 4)
  readBuf.unmap()

  const out = new URL(`../public/img/${scene.file}`, import.meta.url)
  await Deno.writeFile(out, await encodePng(rgba, W, H))
  console.log(`wrote public/img/${scene.file}`)
}

// ---- minimal PNG encoder (8-bit RGB, no filtering) ----

async function encodePng(rgba: Uint8Array, w: number, h: number) {
  const raw = new Uint8Array((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1)
    for (let x = 0; x < w; x++) {
      raw.set(rgba.subarray((y * w + x) * 4, (y * w + x) * 4 + 3), row + 1 + x * 3)
    }
  }
  const zlib = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer())
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, w)
  dv.setUint32(4, h)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  return concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib), chunk('IEND', new Uint8Array())])
}

function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, data.length)
  out.set(new TextEncoder().encode(type), 4)
  out.set(data, 8)
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

function crc32(bytes: Uint8Array) {
  let c = ~0
  for (const b of bytes) {
    c ^= b
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) (out.set(p, o), (o += p.length))
  return out
}
