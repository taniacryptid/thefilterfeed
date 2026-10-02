# The Filter Feed

A personal fishkeeping blog built around an interactive pixel-art aquarium. The homepage embeds a
self-contained WebGPU game — a community tank of banded corydoras and cherry barbs you can feed by
tapping the water and toggle species in and out of — and
the blog ("Field Notes") collects hands-on notes about tanks, sand sifting behavior, plants, and
maintenance routines.

## Tech Stack

- **TanStack Start** (React 19, TanStack Router v1) on Vite 7
- **Tailwind CSS 4** with a custom pixel-aquarium theme (`src/styles.css`)
- **Content Collections** for type-safe markdown posts in `content/posts/`
- **Netlify Image CDN** (`/.netlify/images?url=…`) serves all post imagery resized as WebP
- **WebGPU game** served as a plain static file from `public/game/`, embedded via iframe

## Local Development

```bash
npm install
npm run dev      # dev server on port 3000
npm run build    # production build
npm run preview  # preview the production build
```

With the Netlify CLI you can also run `netlify dev` (proxies port 8888 to the app on 3000).

## Where Things Live

| Path | What it is |
|------|------------|
| `public/game/index.html` | The WebGPU aquarium; species sprites, behaviour and toggles all live here |
| `content/posts/*.md` | Blog posts; frontmatter: title, summary, categories, image, date |
| `src/components/AquariumGame.tsx` | WebGPU detection + iframe frame with fallback states |
| `src/routes/` | Home, `/blog`, `/posts/$slug`, `/category/$category` |
| `src/styles.css` | Theme tokens + pixel-art classes (`.pixel-frame`, `.pxshadow`, `.prose-reef`) |

Post images live in `public/img/` and are always served through the Netlify Image CDN, never
referenced directly. They are WebGPU snapshots rendered with the tank's own shader — edit the
scenes in `scripts/snapshot-creatures.ts` and regenerate with
`deno run --unstable-webgpu -A scripts/snapshot-creatures.ts`.

## Writing and Editing Posts

Every post is one Markdown file in `content/posts/`. You can do everything from github.com in your
browser. You don't need a local setup.

**To publish a new post:**

1. On GitHub, open `content/post-template.md` and copy everything in it.
2. Go to the `content/posts/` folder and choose **Add file → Create new file**.
3. Name the file something short like `new-shrimp-colony.md`, paste the template and fill it in.
4. Choose **Commit changes**. Netlify rebuilds the site, and the post goes live in a minute or two.

**To edit a post:** open its file in `content/posts/`, click the pencil icon, make your changes
and commit.

**To remove a post:** open the file, choose **⋯ → Delete file** and commit.

### The bit at the top (frontmatter)

| Field | What to put |
|-------|-------------|
| `date` | Publish date as `YYYY-MM-DD`. Newest posts show first. |
| `title` | The headline. The post's URL is built from it, so changing the title changes the link. |
| `summary` | One-line teaser for post cards. Leave it as `""` to hide it. |
| `categories` | One or more, each on its own `  - ` line. Existing ones: Tanks, Corydoras, Behavior, Plants, Maintenance. A new name creates a new category page. |
| `image` | A filename from `public/img/`: `corydoras-pair.png`, `planted-tank.png`, `sand-sifting.png` or `water-change.png`. |

Everything below the second `---` is the post body, in regular Markdown (`## headings`,
`**bold**`, lists, links).

Tip: to check a change before it goes live, commit it to a new branch and open a pull request.
Netlify posts a Deploy Preview link on the pull request.
