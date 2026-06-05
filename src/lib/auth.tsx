import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthCtx {
  user: User | null
  session: Session | null
  tenantId: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

async function fetchTenantId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_user_id', userId)
    .single()
  return data?.id ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) setTenantId(await fetchTenantId(s.user.id))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, s) => {
      setSession(s)
      const u = s?.user ?? null
      setUser(u)
      setTenantId(u ? await fetchTenantId(u.id) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, tenantId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
