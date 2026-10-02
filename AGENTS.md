# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

**The Filter Feed** — a personal fishkeeping blog whose homepage is an interactive pixel-art
aquarium (banded corydoras + cherry barbs + cherry shrimp, toggleable per species) rendered live in WebGPU. Built with TanStack Start and deployed on
Netlify.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (`@theme` tokens in `src/styles.css`) |
| Content | Content Collections (type-safe markdown posts) |
| Game | Self-contained WebGPU page served from `public/game/` in an iframe |
| Images | Netlify Image CDN (`/.netlify/images?url=…`) for all post/hero imagery |
| Language | TypeScript 5.9 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── content/posts/            # Markdown blog posts ("field notes"); frontmatter: title, summary,
│                             #   categories[], image, date. Slug is derived from the title.
├── public/
│   ├── game/index.html       # The WebGPU aquarium game (self-contained; species + toggles live here).
│   ├── img/                  # Post images: WebGPU snapshots of the tank (scripts/snapshot-creatures.ts).
│   ├── favicon.ico           # Multi-size ICO rendered from the game's own fish sprite.
│   └── favicon.png           # 64px PNG version used in the header logo.
├── src
│   ├── components
│   │   ├── AquariumGame.tsx  # Homepage centerpiece: feature frame + iframe of /game/,
│   │   │                     #   WebGPU capability detection with friendly fallback states.
│   │   ├── blog-posts.tsx    # PostCard (card used home + blog) and BlogPosts list view.
│   │   └── ui/card.tsx       # Generic card primitive (currently unused by themed pages).
│   ├── routes
│   │   ├── __root.tsx        # Root layout: header nav, footer, fonts, site meta/OG tags.
│   │   ├── index.tsx         # Homepage: AquariumGame + two latest posts + tip panel.
│   │   ├── blog.tsx          # /blog — all field notes.
│   │   ├── posts.$slug.tsx   # Post detail: markdown via marked(), keep-reading links.
│   │   └── category.$category.tsx  # Posts filtered by category.
│   └── styles.css            # Tailwind 4 theme tokens + pixel-art component classes
│                             #   (.pixel-frame, .pxshadow, .dither-water, .prose-reef, …).
├── scripts/snapshot-creatures.ts  # Deno + WebGPU: renders posed tank scenes to public/img/*.png.
├── content-collections.ts    # Zod schema for post frontmatter.
├── netlify.toml              # Build config + cache headers for /game/* and /img/*.
└── vite.config.ts            # TanStack Start + Netlify + Tailwind + Content Collections plugins.
```

## Key Concepts

### The Game Is Static, On Purpose

The aquarium (`public/game/index.html`) is a single self-contained HTML file with inline WGSL.
It is served verbatim as a static file and embedded via `<iframe src="/game/">`. Do not port it
into React or bundle it — it has its own fonts, styles, and requestAnimationFrame loop. The
React wrapper (`AquariumGame.tsx`) only handles detection/fallback UI around the iframe.

### Species in the tank

Each species is a sprite string array in the game file (`SPRITE` = corydoras, `BARB` = cherry
barb, `SHRIMP` = cherry shrimp) packed into one storage buffer by `buildSprites()`. Every fish's second uniform vec4 carries
a species code in `.w` (0 cory, 1 male barb, 2 female barb, 3–6 shrimp morphs: red, orange, blue,
yellow); the shader branches on it for sprite and palette. JS behaviour lives in the `SPECIES`
registry plus a per-species update function (corys roam the sand, barbs school mid-water, shrimp
pick over the sand with short swims and backward escape flicks). The in-tank toggle buttons (`[data-species]`) call
`setSpecies()`; fish swim off-screen when removed, and the choice persists in localStorage
(`filterfeed:tank`). Up to `MAX_FISH` (20) fish total. To add a species: new sprite + palette fn
in WGSL, a species code, a `SPECIES` entry, an update function, and a toggle button. The snapshot
script reuses `buildSprites()` and the `U_*` layout constants, so keep them in the extracted block.

### Design System

The whole site is themed to match the game's palette (deep teal water, warm sand, coral-orange
accents). Tailwind 4 theme tokens are defined in `src/styles.css` (`--color-abyss`, `--color-deep`,
`--color-water`, `--color-kelp`, `--color-surf`, `--color-sand`, `--color-clay`, `--color-ink`,
`--color-inksoft`, `--color-foam`). Fonts: Pixelify Sans (pixel display/headings), Fraunces (long
prose), JetBrains Mono (body/UI). Reusable classes: `.pixel-frame`, `.pxshadow`, `.pxshadow-sm`,
`.dither-water`, `.scanlines`, `.pellet-row`, `.blink`, `.rise`/`.rise-1..3`, `.prose-reef`.

### Content Collections

Markdown files in `content/posts/` are type-safe blog posts:

- Frontmatter validated against the Zod schema in `content-collections.ts`
- Imported as typed array: `import { allPosts } from 'content-collections'`
- Each post has: `title`, `summary`, `categories[]`, `slug` (derived), `image`, `date`, `content`
- `image` values are filenames inside `public/img/` and are always served through the Netlify
  Image CDN (`/.netlify/images?url=/img/<file>&w=…&fm=webp`), never referenced directly.

### Blog Images Are WebGPU Snapshots

Every post image is a still frame rendered by the tank's own WGSL shader and sprite, so blog art
always matches the aquarium. `scripts/snapshot-creatures.ts` reads `public/game/index.html`,
extracts `SPRITE`/`WGSL`, poses fish/bubbles/food per scene (the `SCENES` array), renders each
offscreen at 1200x640 with WebGPU and writes a PNG. To add or change an image, edit `SCENES` and run:

```bash
deno run --unstable-webgpu -A scripts/snapshot-creatures.ts
```

Do not use AI-generated or stock imagery for posts.

### Netlify Image CDN

All post images route through `/.netlify/images?url=/img/<file>&w=<width>&fm=webp`. Keep
generated PNGs in `public/img/` (they are large); the CDN handles resizing and format.

## Development Commands

```bash
npm run dev      # Start dev server (port 3000; netlify dev proxies 8888 → 3000)
npm run build    # Production build (vite build)
npm run preview  # Preview production build
```

## Conventions

### Naming
- Components: PascalCase (`AquariumGame.tsx`)
- Routes: lowercase, dot-notation files (`posts.$slug.tsx`)
- Utilities/hooks: camelCase

### Styling
- Tailwind CSS utility classes with custom theme colors (`bg-deep`, `text-surf`, `border-kelp`)
- `cn()` helper for conditional class merging (`src/lib/utils.ts`)
- Pixel-art visual classes live in `src/styles.css`, not inline styles

### TypeScript
- Strict mode enabled
- Import paths use `@/` alias for `src/*`
- Type-only imports with `type` keyword
- Zod for content frontmatter validation

## Non-Obvious Decisions

- The game zip was uploaded by the user; tank changes (like new species) happen inside
  `public/game/index.html` and stay self-contained there.
- Post bodies and summaries are intentionally empty placeholders. Never write post copy — only
  add written content the site owner provides. Empty summaries/bodies are hidden in the UI.
- Post dates in frontmatter are ISO strings (`2026-09-02`); list views sort descending by date.
- Favicon is generated from the game's sprite palette (see `public/favicon.png`) — regenerate by
  rendering the `SPRITE` array from the game file rather than sourcing a new image.
