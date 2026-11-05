import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ProfileRow } from '@/shared/api/database.types'

export type AuthContextValue = {
  session: Session | null
  profile: ProfileRow | null
  isLoading: boolean
  profileError: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
