import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AuthShell } from '../components/AuthShell.jsx'

export function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      <form className="space-y-5">

        {/* Email */}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Email Address
          </span>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />

            <input
              type="email"
              placeholder="you@example.com"
              required
              className="w-full border-0 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-sm font-medium"
            />
          </div>
        </label>

        {/* Send Reset Link */}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150"
        >
          Send Reset Link
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
    </AuthShell>
  )
}