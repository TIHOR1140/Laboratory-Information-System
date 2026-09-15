import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { AuthShell } from '../components/AuthShell.jsx'
import { api } from '../lib/api.js'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token. Please request a new link.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setMessage(response.data.message)
      setTimeout(() => navigate('/login'), 4000)
    } catch (err) {
      const serverMessage = err.response?.data?.message
      const serverErrors = err.response?.data?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        const errorDetails = Object.entries(serverErrors)
          .map(([field, msg]) => msg)
          .join(' ')
        setError(`${serverMessage ? `${serverMessage}: ` : ''}${errorDetails}`)
      } else {
        setError(serverMessage || 'Failed to reset password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Create New Password"
      subtitle="Enter a strong new password for your account."
    >
      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-500" />
          <h3 className="mb-2 text-lg font-semibold text-green-800">Password Reset!</h3>
          <p className="text-sm text-green-700">{message}</p>
          <p className="mt-4 text-xs text-green-600">Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
              {error}
            </div>
          )}

          {/* New Password */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              New Password
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
              <Lock className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !token}
                className="w-full border-0 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-sm font-medium disabled:opacity-50"
              />
            </div>
          </label>

          {/* Confirm Password */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Confirm New Password
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
              <Lock className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !token}
                className="w-full border-0 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-sm font-medium disabled:opacity-50"
              />
            </div>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !token}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:active:scale-100 gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
          </button>

          {/* Back to Sign In */}
          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
            >
              ← Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
