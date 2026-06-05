import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [notice, setNotice]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else nav('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setNotice('Account created — check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c2340' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <svg width="36" height="36" viewBox="0 0 34 34" fill="none">
            <rect x="1" y="1" width="32" height="32" rx="9" fill="url(#lg)"/>
            <path d="M12 9.5v15M12 17.2l6.3-6.3M13.2 16.4l6 8.1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="23.6" cy="11" r="1.9" fill="#f5b91e"/>
            <defs><linearGradient id="lg" x1="1" y1="1" x2="33" y2="33" gradientUnits="userSpaceOnUse"><stop stopColor="#0a86e6"/><stop offset="1" stopColor="#005aa6"/></linearGradient></defs>
          </svg>
          <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>
            Pro Piper <span style={{ color: '#f5b91e' }}>·</span>
          </span>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 700, color: '#0c1118', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#697384', marginBottom: 24 }}>
            {mode === 'signin' ? 'Welcome back.' : 'Get started with Pro Piper.'}
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#3a424f', marginBottom: 5 }}>Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', borderRadius: 10, border: '1px solid #dfe2e9', padding: '10px 12px', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#3a424f', marginBottom: 5 }}>Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', borderRadius: 10, border: '1px solid #dfe2e9', padding: '10px 12px', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error  && <div style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontFamily: 'Inter, sans-serif' }}>{error}</div>}
            {notice && <div style={{ fontSize: 13, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontFamily: 'Inter, sans-serif' }}>{notice}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: 10, background: '#0072ce', color: '#fff',
              fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 4
            }}>
              {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#697384' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setNotice(null) }}
              style={{ background: 'none', border: 'none', color: '#0072ce', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
          Powered by Karna
        </div>
      </div>
    </div>
  )
}
