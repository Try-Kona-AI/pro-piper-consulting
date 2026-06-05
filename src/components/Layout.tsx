import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/',          label: 'Dashboard',    end: true },
  { to: '/invoices',  label: 'Invoices' },
  { to: '/customers', label: 'Customers' },
  { to: '/winback',   label: 'Win-back' },
  { to: '/jobs',      label: 'Jobs & Quotes' },
]

const bottomNav = [
  { to: '/guide',    label: 'Help & Guide' },
  { to: '/settings', label: 'Settings' },
]

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to} end={end}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function BottomNavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
        <rect x="1" y="1" width="32" height="32" rx="9" fill="url(#sl)"/>
        <path d="M12 9.5v15M12 17.2l6.3-6.3M13.2 16.4l6 8.1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="23.6" cy="11" r="1.9" fill="#f5b91e"/>
        <defs><linearGradient id="sl" x1="1" y1="1" x2="33" y2="33" gradientUnits="userSpaceOnUse"><stop stopColor="#0a86e6"/><stop offset="1" stopColor="#005aa6"/></linearGradient></defs>
      </svg>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">Pro Piper</div>
        <div className="text-[11px] text-slate-400">Plumbing · Queens, NY</div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const [open, setOpen]   = useState(false)
  const location          = useLocation()

  // Close drawer on every navigation
  useEffect(() => { setOpen(false) }, [location.pathname])

  const sidebar = (
    <>
      <Logo />

      <nav className="flex flex-col gap-1 px-3">
        {nav.map(n => <NavItem key={n.to} {...n} />)}
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 pt-3 pb-4">
        {bottomNav.map(n => <BottomNavItem key={n.to} {...n} />)}
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-1 truncate px-3 text-[11px] text-slate-500">{user?.email}</div>
          <button
            onClick={() => void signOut()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Mobile top bar ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-[#0c2340] px-4 md:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {open ? (
            /* X icon */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"/>
            </svg>
          ) : (
            /* Hamburger icon */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" clipRule="evenodd"/>
            </svg>
          )}
        </button>

        {/* Mini logo */}
        <svg width="24" height="24" viewBox="0 0 34 34" fill="none">
          <rect x="1" y="1" width="32" height="32" rx="9" fill="url(#sl2)"/>
          <path d="M12 9.5v15M12 17.2l6.3-6.3M13.2 16.4l6 8.1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="23.6" cy="11" r="1.9" fill="#f5b91e"/>
          <defs><linearGradient id="sl2" x1="1" y1="1" x2="33" y2="33" gradientUnits="userSpaceOnUse"><stop stopColor="#0a86e6"/><stop offset="1" stopColor="#005aa6"/></linearGradient></defs>
        </svg>
        <span className="text-sm font-semibold text-white">Pro Piper</span>
      </header>

      {/* ── Drawer backdrop (mobile only) ──────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      {/*
          Mobile:  fixed, slides in/out via translate-x
          Desktop: fixed, always visible, main content offset by ml-60
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#0c2340]
          transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebar}
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="md:ml-60">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
