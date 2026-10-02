import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'

import '../styles.css'

const siteName = 'The Filter Feed'
const siteDescription =
  'A pixel-art community aquarium you can feed, plus field notes from a home fishkeeping log.'

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..700&family=JetBrains+Mono:ital,wght@0,400..700;1,400&display=swap',
      },
    ],
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen dither-water">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <Scripts />
      </body>
    </html>
  )
}

function SiteHeader() {
  return (
    <header className="border-b-4 border-kelp bg-abyss/85 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-3 no-underline">
          <img
            src="/favicon.png"
            alt=""
            width={36}
            height={36}
            className="pixelated h-9 w-9 border-2 border-ink bg-water pxshadow-sm transition-transform group-hover:-rotate-3"
          />
          <span className="font-pixel text-lg font-semibold tracking-wide text-ink transition-colors group-hover:text-surf sm:text-xl">
            The Filter Feed
          </span>
        </Link>
        <nav className="flex items-center gap-1 font-pixel text-sm sm:gap-2 sm:text-base">
          <NavLink to="/">Aquarium</NavLink>
          <NavLink to="/blog">Field Notes</NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === '/' }}
      className="px-3 py-1.5 text-inksoft no-underline transition-colors hover:text-ink data-[status=active]:bg-kelp data-[status=active]:text-ink data-[status=active]:pxshadow-sm"
    >
      {children}
    </Link>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t-4 border-kelp bg-abyss/90">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center font-pixel text-sm text-inksoft sm:px-6">
        <div className="pellet-row w-24" aria-hidden="true" />
        <p className="m-0">The Filter Feed — a fed fish is a happy fish.</p>
        <p className="m-0 text-xs opacity-70">Corydoras and cherry barbs rendered live in WebGPU.</p>
      </div>
    </footer>
  )
}
