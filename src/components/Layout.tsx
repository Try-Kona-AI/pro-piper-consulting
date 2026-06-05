import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/',          label: 'Dashboard',    end: true },
  { to: '/invoices',  label: 'Invoices' },
  { to: '/customers', label: 'Customers' },
  { to: '/winback',   label: 'Win-back' },
  { to: '/jobs',      label: 'Jobs & Quotes' },
]

const bottomNav = [
  { to: '/guide',     label: 'Help & Guide' },
  { to: '/settings',  label: 'Settings' },
]

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-full">
      <aside className="flex w-60 shrink-0 flex-col bg-[#0c2340]">
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav + user + logout */}
        <div className="mt-auto border-t border-white/10 px-3 pt-3 pb-4">
          {bottomNav.map((n) => (
            <NavLink
              key={n.to} to={n.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
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
      </aside>

      <main className="flex-1 overflow-auto bg-slate-100">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
