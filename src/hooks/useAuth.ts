import { useEffect, useState } from 'react'
import { getUser, onAuthChange, type User } from '@netlify/identity'

// Client-side view of the signed-in user. `undefined` while still checking.
export function useAuth(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    getUser().then(setUser)
    return onAuthChange((_event, u) => setUser(u))
  }, [])

  return user
}

export function isEditor(user: User | null | undefined): boolean {
  return !!user?.roles?.includes('admin')
}
