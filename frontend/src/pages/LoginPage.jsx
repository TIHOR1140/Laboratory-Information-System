import { Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { api } from '../lib/api.js'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, verify2FALogin, getDashboardPath } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Two-Factor states
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaUserId, setMfaUserId] = useState('')
  const [mfaMethod, setMfaMethod] = useState('TOTP')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaResending, setMfaResending] = useState(false)
  const [mfaResendSuccess, setMfaResendSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await login(form)
      if (response.require2FA) {
        setMfaUserId(response.userId)
        setMfaMethod(response.method)
        setMfaRequired(true)
        setMfaCode('')
      } else {
        navigate(getDashboardPath(response.user.role), { replace: true })
      }
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMfaResendSuccess('')

    try {
      const session = await verify2FALogin({
        userId: mfaUserId,
        code: mfaCode,
        rememberMe: form.rememberMe,
      })
      navigate(getDashboardPath(session.user.role), { replace: true })
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Invalid verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendMfa = async () => {
    setMfaResending(true)
    setError('')
    setMfaResendSuccess('')
    try {
      const response = await api.post('/auth/resend-2fa', { userId: mfaUserId })
      setMfaResendSuccess(response.data.message || 'Verification code resent successfully.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend code.')
    } finally {
      setMfaResending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-slate-100 via-blue-50/30 to-blue-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 overflow-hidden font-sans">
      
      {/* Login Card - Solid White with Border */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl transition-all duration-300">

    
  {/* Lab logo */}
    <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border-[0.5px] border-slate-200/50 dark:border-slate-800/50 shadow-sm">
    <img
     src="/lab-logo.png"
      alt="Lab logo"
      className="h-full w-full object-contain"
    />
    </div>


        {!mfaRequired ? (
          <>
        <>
    {/* Lab Name */}
     <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
       Life Care Medical Laboratory
      </h2>

    {/* Login Header */}
    <h1 className="mt-5 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
      Sign In
    </h1>

  </>

            {/* Error Alert */}
            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-450 font-medium">
                {error}
              </div>
            )}

            {/* Credentials Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              
              {/* Email field */}
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">Email Address</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:ring-offset-0 transition-all duration-150">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    id="login-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="w-full border-0 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-sm font-medium"
                  />
                </div>
              </label>

              {/* Password field */}
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:ring-offset-0 transition-all duration-150">
                  <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="w-full border-0 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((c) => !c)}
                    className="text-slate-400 hover:text-slate-650 transition cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {/* Forget password*/}
              <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-sm font-medium !text-blue-700 hover:!text-blue-800 transition-colors"
              >
                Forgot password?
              </Link>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-75 cursor-pointer"
              >
                {loading && <LoaderCircle className="h-4 w-4 animate-spin text-white" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Register link divider */}
            <div className="my-6 flex items-center justify-between gap-3">
              <span className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-semibold text-slate-450">New patient?</span>
              <span className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
              >
                Create an account
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Header */}
            <h1 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              2-Step Verification
            </h1>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {mfaMethod === 'EMAIL' 
                ? 'We have sent a 6-digit verification code to your email address.' 
                : 'Enter the verification code from your authenticator app.'}
            </p>

            {/* Error Alert */}
            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-450 font-medium">
                {error}
              </div>
            )}

            {/* Resend Success Alert */}
            {mfaResendSuccess && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium font-semibold">
                {mfaResendSuccess}
              </div>
            )}

            {/* 2FA Verification Form */}
            <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
              
              {/* Code field */}
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">6-Digit Passcode</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                  <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000"
                    required
                    className="w-full border-0 bg-transparent text-slate-900 outline-none text-sm font-bold tracking-widest text-center"
                  />
                </div>
              </label>

              {/* Resend link for Email OTP */}
              {mfaMethod === 'EMAIL' && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleResendMfa}
                    disabled={mfaResending}
                    className="text-xs font-bold text-blue-600 hover:text-blue-750 transition disabled:opacity-50"
                  >
                    {mfaResending ? 'Resending...' : 'Resend Code'}
                  </button>
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || !mfaCode}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-75"
              >
                {loading && <LoaderCircle className="h-4 w-4 animate-spin text-white" />}
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false)
                  setError('')
                  setMfaResendSuccess('')
                }}
                className="inline-flex w-full items-center justify-center py-2 text-xs font-bold text-slate-400 hover:text-slate-650 transition"
              >
                Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}