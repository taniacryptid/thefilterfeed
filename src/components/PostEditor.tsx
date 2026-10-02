import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { marked } from 'marked'

import { cn } from '@/lib/utils'
import { type BlogPost, POST_IMAGES } from '@/lib/posts'
import { deletePost, savePost } from '@/server/posts'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function PostEditor({ post }: { post?: BlogPost }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(post?.title ?? '')
  const [date, setDate] = useState(post?.date ?? today())
  const [summary, setSummary] = useState(post?.summary ?? '')
  const [categories, setCategories] = useState(post?.categories.join(', ') ?? '')
  const [image, setImage] = useState(post?.image ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const preview = useMemo(() => (tab === 'preview' ? (marked(content) as string) : ''), [tab, content])

  async function save(published: boolean) {
    setBusy(true)
    setError('')
    setSaved('')
    try {
      const { slug } = await savePost({
        data: {
          slug: post?.slug,
          title,
          date,
          summary,
          categories: categories
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          image,
          content,
          published,
        },
      })
      if (!post) {
        navigate({ to: '/admin/edit/$slug', params: { slug } })
      } else {
        setSaved(published ? 'Published.' : 'Saved as draft.')
      }
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const msg =
      post?.source === 'edited'
        ? 'Discard your edits and go back to the original version from the repo?'
        : 'Delete this note for good?'
    if (!post || !confirm(msg)) return
    setBusy(true)
    try {
      await deletePost({ data: { slug: post.slug } })
      navigate({ to: '/admin' })
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rise mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin" className="font-pixel text-sm text-surf no-underline hover:text-foam">
            ← Editor's desk
          </Link>
          <h1 className="mt-1 mb-0 font-pixel text-3xl font-semibold text-ink">
            {post ? 'Edit field note' : 'New field note'}
          </h1>
          {post && (
            <p className="m-0 mt-1 text-xs text-inksoft">
              /posts/{post.slug} · {post.published ? 'published' : 'draft'}
            </p>
          )}
        </div>
        {post?.published && (
          <Link to="/posts/$slug" params={{ slug: post.slug }} className="btn-px-ghost">
            View live
          </Link>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(true)
        }}
        className="rise rise-2 pixel-frame bg-deep pxshadow space-y-5 p-5 sm:p-8"
      >
        <label className="field-px">
          <span>Title</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="field-px">
            <span>Date</span>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field-px">
            <span>Categories</span>
            <input
              value={categories}
              placeholder="Corydoras, Tanks"
              onChange={(e) => setCategories(e.target.value)}
            />
            <small>Comma separated.</small>
          </label>
        </div>

        <label className="field-px">
          <span>Summary</span>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} />
          <small>Shown on post cards. Optional.</small>
        </label>

        <div className="field-px">
          <span>Tank snapshot</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ImageChoice selected={image === ''} onClick={() => setImage('')}>
              <span className="flex aspect-[120/64] items-center justify-center bg-abyss font-pixel text-xs text-inksoft">
                No image
              </span>
            </ImageChoice>
            {POST_IMAGES.map((file) => (
              <ImageChoice key={file} selected={image === file} onClick={() => setImage(file)}>
                <img
                  src={`/.netlify/images?url=/img/${file}&w=240&fm=webp`}
                  alt={file}
                  className="pixelated block aspect-[120/64] w-full object-cover"
                />
              </ImageChoice>
            ))}
          </div>
        </div>

        <div className="field-px">
          <div className="flex items-center justify-between">
            <span>Body (Markdown)</span>
            <div className="flex gap-1 font-pixel text-xs">
              {(['write', 'preview'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'cursor-pointer border-2 px-2 py-0.5 capitalize',
                    tab === t ? 'border-surf bg-kelp text-ink' : 'border-kelp bg-abyss text-inksoft',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === 'write' ? (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} />
          ) : (
            <div className="min-h-[24rem] border-2 border-kelp bg-abyss p-5">
              {content.trim() ? (
                <div className="prose-reef" dangerouslySetInnerHTML={{ __html: preview }} />
              ) : (
                <p className="m-0 font-pixel text-inksoft">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="m-0 border-2 border-clay bg-abyss px-3 py-2 text-sm text-clay">{error}</p>}
        {saved && <p className="m-0 border-2 border-kelp bg-abyss px-3 py-2 text-sm text-foam">{saved}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" disabled={busy} className="btn-px">
            {busy ? 'Saving…' : 'Publish'}
          </button>
          <button type="button" disabled={busy} onClick={() => save(false)} className="btn-px-ghost">
            Save as draft
          </button>
          {post && post.source !== 'file' && (
            <button type="button" disabled={busy} onClick={remove} className="btn-px-ghost btn-px-danger ml-auto">
              {post.source === 'edited' ? 'Revert to original' : 'Delete'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function ImageChoice({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'cursor-pointer border-[3px] p-0 transition-colors',
        selected ? 'border-sand pxshadow-sm' : 'border-kelp opacity-70 hover:opacity-100',
      )}
    >
      {children}
    </button>
  )
}

function errorMessage(e: unknown): string {
  if (!(e instanceof Error)) return 'Something went wrong.'
  // Validation errors arrive as a JSON list of issues.
  try {
    const issues = JSON.parse(e.message)
    if (Array.isArray(issues) && issues[0]?.message) return issues[0].message
  } catch {}
  return e.message === 'Not authorized' ? 'Your session expired — log in again.' : e.message
}
