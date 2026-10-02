import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AuthError,
  MissingIdentityError,
  acceptInvite,
  handleAuthCallback,
  login,
  logout,
  requestPasswordRecovery,
  updateUser,
} from '@netlify/identity'

import { isEditor, useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Log in — The Filter Feed' }, { name: 'robots', content: 'noindex' }] }),
  component: LoginPage,
})

type Mode =
  | { kind: 'login' }
  | { kind: 'forgot' }
  | { kind: 'invite'; token: string }
  | { kind: 'recovery' }

function LoginPage() {
  const user = useAuth()
  const [mode, setMode] = useState<Mode>({ kind: 'login' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Invite, recovery and confirmation emails land here with a token in the hash.
  useEffect(() => {
    handleAuthCallback()
      .then((result) => {
        if (!result) return
        if (result.type === 'invite' && result.token) {
          setMode({ kind: 'invite', token: result.token })
        } else if (result.type === 'recovery') {
          setMode({ kind: 'recovery' })
        } else if (result.type === 'confirmation') {
          setNotice('Email confirmed — you are signed in.')
        }
      })
      .catch((e) => setError(describe(e)))
  }, [])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
    } catch (e) {
      setError(describe(e))
    } finally {
      setBusy(false)
    }
  }

  const goToDesk = () => {
    // Full navigation so the server sees the fresh nf_jwt cookie.
    window.location.href = '/admin'
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode.kind === 'login') {
      run(async () => {
        const u = await login(email, password)
        if (isEditor(u)) goToDesk()
        else setNotice('Signed in, but this account does not have editor access yet.')
      })
    } else if (mode.kind === 'forgot') {
      run(async () => {
        await requestPasswordRecovery(email)
        setNotice('If that address has an account, a reset link is on its way.')
      })
    } else if (mode.kind === 'invite') {
      run(async () => {
        const u = await acceptInvite(mode.token, password)
        if (isEditor(u)) goToDesk()
        else {
          setMode({ kind: 'login' })
          setNotice('Account created. Ask the site admin to grant the editor role, then log in.')
        }
      })
    } else {
      run(async () => {
        await updateUser({ password })
        goToDesk()
      })
    }
  }

  const heading = {
    login: 'Keeper log in',
    forgot: 'Reset your password',
    invite: 'Set a password to accept your invite',
    recovery: 'Choose a new password',
  }[mode.kind]

  const signedInView = user && mode.kind === 'login' && !notice

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rise pixel-frame bg-deep pxshadow p-6 sm:p-8">
        <p className="m-0 font-pixel text-sm text-surf">// staff only</p>
        <h1 className="mt-1 mb-6 font-pixel text-2xl font-semibold text-ink">{heading}</h1>

        {signedInView ? (
          <div className="space-y-4">
            <p className="m-0 text-sm text-foam">
              Signed in as <span className="text-ink">{user.email}</span>.
            </p>
            {isEditor(user) ? (
              <button type="button" onClick={goToDesk} className="btn-px w-full">
                Go to the editor's desk →
              </button>
            ) : (
              <p className="m-0 text-sm text-inksoft">
                This account doesn't have editor access.
              </p>
            )}
            <button
              type="button"
              onClick={() => run(async () => { await logout(); window.location.href = '/' })}
              className="btn-px-ghost w-full"
            >
              Log out
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {(mode.kind === 'login' || mode.kind === 'forgot') && (
              <label className="field-px">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {mode.kind !== 'forgot' && (
              <label className="field-px">
                <span>{mode.kind === 'login' ? 'Password' : 'New password'}</span>
                <input
                  type="password"
                  required
                  minLength={mode.kind === 'login' ? undefined : 8}
                  autoComplete={mode.kind === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}

            {error && <p className="m-0 border-2 border-clay bg-abyss px-3 py-2 text-sm text-clay">{error}</p>}
            {notice && <p className="m-0 border-2 border-kelp bg-abyss px-3 py-2 text-sm text-foam">{notice}</p>}

            <button type="submit" disabled={busy} className="btn-px w-full">
              {busy
                ? 'One moment…'
                : mode.kind === 'login'
                  ? 'Log in'
                  : mode.kind === 'forgot'
                    ? 'Send reset link'
                    : 'Save password'}
            </button>

            {mode.kind === 'login' && (
              <button type="button" onClick={() => setMode({ kind: 'forgot' })} className="link-px">
                Forgot your password?
              </button>
            )}
            {mode.kind === 'forgot' && (
              <button type="button" onClick={() => setMode({ kind: 'login' })} className="link-px">
                ← Back to log in
              </button>
            )}
          </form>
        )}
      </div>
      <p className="mt-6 text-center">
        <Link to="/" className="font-pixel text-sm text-surf hover:text-foam">
          ← Back to the tank
        </Link>
      </p>
    </div>
  )
}

function describe(e: unknown): string {
  if (e instanceof MissingIdentityError) return 'Log in is not available on this deploy yet.'
  if (e instanceof AuthError) {
    if (e.status === 401) return 'Invalid email or password.'
    if (e.status === 422) return 'That password is too weak, or the email is malformed.'
    return e.message
  }
  return e instanceof Error ? e.message : 'Something went wrong.'
}
