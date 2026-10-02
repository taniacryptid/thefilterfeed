import { createServerFn } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'

export const EDITOR_ROLE = 'admin'

export type Editor = { email: string; name: string }

// Returns the signed-in user only if they hold the editor role. Every write
// goes through this, so a plain signup can never touch the posts.
export async function requireEditor(): Promise<Editor> {
  const editor = await currentEditor()
  if (!editor) throw new Error('Not authorized')
  return editor
}

async function currentEditor(): Promise<Editor | null> {
  const user = await getUser()
  if (!user || !user.roles?.includes(EDITOR_ROLE)) return null
  return { email: user.email ?? '', name: user.name ?? user.email ?? '' }
}

export const getEditor = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getUser()
  if (!user) return { signedIn: false as const, editor: null }
  return { signedIn: true as const, editor: await currentEditor() }
})
