import { useState } from 'react'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle2,
  UsersRound,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getDashboardPath } from '../lib/authStorage.js'

const navigationByRole = {
  ADMIN: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', to: '/admin/users', icon: UsersRound },
    { label: 'Profile', to: '/profile', icon: UserCircle2 },
  ],
  RECEPTIONIST: [
    { label: 'Dashboard', to: '/reception/dashboard', icon: LayoutDashboard },
    { label: 'Profile', to: '/profile', icon: UserCircle2 },
  ],
  TECHNICIAN: [
    { label: 'Dashboard', to: '/lab/dashboard', icon: LayoutDashboard },
    { label: 'Profile', to: '/profile', icon: UserCircle2 },
  ],
  PATIENT: [
    { label: 'Dashboard', to: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Profile', to: '/profile', icon: UserCircle2 },
  ],
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const items = navigationByRole[user?.role] ?? navigationByRole.PATIENT

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(180deg,_#eff8ff_0%,_#f7fbff_45%,_#eaf2fb_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="hidden w-full max-w-[300px] border-r border-white/40 bg-white/35 p-6 backdrop-blur-xl lg:flex lg:flex-col">
          <Link to={getDashboardPath(user?.role)} className="flex items-center gap-3 text-slate-900">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-700 text-white shadow-lg shadow-sky-700/20">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">LIS Module 1</p>
              <h1 className="text-lg font-semibold">Laboratory Information System</h1>
            </div>
          </Link>

          <div className="mt-8 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-slate-900/5">
            <p className="text-sm font-medium text-slate-500">Signed in as</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-slate-500">{user?.role}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-sky-700 text-white shadow-lg shadow-sky-700/20'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-900/5">
            <p className="text-sm text-slate-500">Current role</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{user?.role}</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/50 bg-white/65 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Laboratory Information System</p>
                  <p className="text-sm text-slate-500">{user?.role} workspace</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath(user?.role)}
                  className="hidden rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 sm:inline-flex"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <UserCircle2 className="h-4 w-4" />
                  {user?.firstName}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>

            {menuOpen ? (
              <div className="border-t border-white/50 px-4 pb-4 sm:px-6 lg:hidden">
                <div className="grid gap-2 pt-4 sm:grid-cols-2">
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          [
                            'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
                            isActive ? 'bg-sky-700 text-white' : 'bg-white/80 text-slate-700',
                          ].join(' ')
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}