import { useState, useEffect } from 'react'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle2,
  UsersRound,
  FlaskConical,
  Sun,
  Moon,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getDashboardPath } from '../lib/authStorage.js'

const navigationByRole = {
  ADMIN: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', to: '/admin/users', icon: UsersRound },
    { label: 'Test Directory', to: '/admin/tests', icon: FlaskConical },
    { label: 'Security & Sessions', to: '/admin/security', icon: ShieldCheck },
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
  const navigation = navigationByRole[user?.role] || []
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('lis_theme') === 'dark'
  })

  // Apply class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('lis_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('lis_theme', 'light')
    }
  }, [darkMode])

  return (
    <div className="flex h-screen bg-[#f3f7fa] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar - Solid White / Dark Slate with Thin Border */}
      <aside className="hidden w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex md:flex-col print:hidden shrink-0">
        <div className="flex h-16 items-center border-b border-slate-200/80 dark:border-slate-800 px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow shadow-blue-600/10">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">LIS Laboratory</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User initials card in Sidebar Footer */}
        <div className="border-t border-slate-200/85 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-slate-700">
              {initials || 'U'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Header - Solid White / Dark Slate */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 print:hidden">
          <div className="flex items-center gap-4">
            <button className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 md:hidden transition">
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-500 uppercase tracking-widest md:block hidden">
              Clinical Workspace / <span className="text-slate-800 dark:text-slate-200 font-extrabold">{user?.role}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <Link to="/profile" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-slate-700 md:hidden">
                {initials || 'U'}
              </span>
            </Link>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}