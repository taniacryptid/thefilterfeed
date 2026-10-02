import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getEditor } from '@/server/auth'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const { editor } = await getEditor()
    if (!editor) throw redirect({ to: '/login' })
    return { editor }
  },
  head: () => ({ meta: [{ title: "Editor's desk — The Filter Feed" }, { name: 'robots', content: 'noindex' }] }),
  component: () => <Outlet />,
})
