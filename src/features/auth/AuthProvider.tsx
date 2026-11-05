import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ProfileRow } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import { getErrorMessage } from '@/shared/lib/errors'
import { AuthContext, type AuthContextValue } from './auth-context'
import { signOut as signOutRequest } from './api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const activeUserIdRef = useRef<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setProfile(null)
      setProfileError(getErrorMessage(error))
      return
    }

    if (!data) {
      setProfile(null)
      setProfileError(
        'Профиль не найден. Попросите администратора проверить учётную запись.',
      )
      return
    }

    setProfile(data as ProfileRow)
    setProfileError(null)
  }, [])

  const handleSession = useCallback(
    async (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id ?? null

      if (activeUserIdRef.current !== nextUserId) {
        queryClient.clear()
        activeUserIdRef.current = nextUserId
      }

      setSession(nextSession)

      if (!nextSession) {
        setProfile(null)
        setProfileError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      await loadProfile(nextSession.user.id)
      setIsLoading(false)
    },
    [loadProfile, queryClient],
  )

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        void handleSession(data.session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        void handleSession(nextSession)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [handleSession])

  const refreshProfile = useCallback(async () => {
    if (session) {
      await loadProfile(session.user.id)
    }
  }, [loadProfile, session])

  const signOut = useCallback(async () => {
    await signOutRequest()
    queryClient.clear()
    activeUserIdRef.current = null
    setSession(null)
    setProfile(null)
    setProfileError(null)
    setIsLoading(false)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      profileError,
      signOut,
      refreshProfile,
    }),
    [session, profile, isLoading, profileError, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
