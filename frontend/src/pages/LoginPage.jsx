import { Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, getDashboardPath } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const session = await login(form)
      navigate(getDashboardPath(session.user.role), { replace: true })
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-slate-100 via-blue-50/30 to-blue-50/60 overflow-hidden font-sans">
      
      {/* Login Card - Solid White with Border */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl transition-all duration-300">
        
        {/* Icon Badge */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
          <LogIn className="h-5 w-5" />
        </div>

        {/* Header */}
        <h1 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">Sign In</h1>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Secure access to your Clinical LIS Workspace
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Email field */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-350 text-sm font-medium"
              />
            </div>
          </label>

          {/* Password field */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
              <Lock className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-350 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((c) => !c)}
                className="text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {/* Forgot password option */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              className="text-xs font-bold text-blue-600 hover:text-blue-750 transition"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-75"
          >
            {loading && <LoaderCircle className="h-4 w-4 animate-spin text-white" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register link divider */}
        <div className="my-6 flex items-center justify-between gap-3">
          <span className="h-[1px] flex-1 bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400">New patient?</span>
          <span className="h-[1px] flex-1 bg-slate-200" />
        </div>

        <p className="text-center text-sm text-slate-600 font-medium">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-extrabold text-blue-600 hover:text-blue-750 transition"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}