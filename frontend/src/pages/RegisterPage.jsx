import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, LoaderCircle, ShieldAlert, ArrowRight, UserPlus, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, verifyRegistration, getDashboardPath } = useAuth()
  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: 'Male', email: '', phone: '', password: '' })
  const [registrationId, setRegistrationId] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Password strength calculation
  const strength = useMemo(() => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 8) score += 1
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1
    if (/\d/.test(p)) score += 1
    if (/[^A-Za-z0-9]/.test(p)) score += 1
    return score
  }, [form.password])

  const strengthText = ['Weak', 'Moderate', 'Good', 'Strong'][strength - 1] || 'Empty'
  const strengthColor = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'][strength]

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await register(form)
      setRegistrationId(result.registrationId)
      setMessage(result.message || 'A verification code was sent to your email address.')
    } catch (submitError) {
      const serverMessage = submitError?.response?.data?.message
      const serverErrors = submitError?.response?.data?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        const errorDetails = Object.entries(serverErrors)
          .map(([field, msg]) => msg)
          .join(' ')
        setError(`${serverMessage ? `${serverMessage}: ` : ''}${errorDetails}`)
      } else {
        setError(serverMessage || 'Unable to register patient account.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const session = await verifyRegistration({ registrationId, otp })
      navigate(getDashboardPath(session.user.role), { replace: true })
    } catch (submitError) {
      const serverMessage = submitError?.response?.data?.message
      setError(serverMessage || 'Unable to verify the email address.')
      if (serverMessage?.includes('all 3 attempts')) {
        setRegistrationId('')
        setOtp('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToRegistration = () => {
    setRegistrationId('')
    setOtp('')
    setError('')
    setMessage('')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          {message}
        </div>
      )}

      {registrationId && (
        <form onSubmit={handleVerify} className="space-y-4 text-slate-800 dark:text-slate-100">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            Enter the 6-digit code sent to <strong>{form.email}</strong>. The code expires in 10 minutes.
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Verification Code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-center text-lg tracking-[0.4em] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
            />
          </label>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-white" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
            Verify Email and Create Account
          </button>
          <button
            type="button"
            onClick={handleBackToRegistration}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registration
          </button>
        </form>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 text-slate-800 dark:text-slate-100${registrationId ? ' hidden' : ''}`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="e.g. John Doe"
            required
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-450 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date of Birth</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((c) => ({ ...c, dateOfBirth: e.target.value }))}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gender</span>
            <select
              value={form.gender}
              onChange={(e) => setForm((c) => ({ ...c, gender: e.target.value }))}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            placeholder="john@example.com"
            required
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-450 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone Number</span>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            placeholder="07xxxxxxxx"
            required
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-450 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            placeholder="••••••••"
            required
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-450 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition duration-150"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 tracking-tight">At least 8 characters, containing uppercase, lowercase, and a number.</span>
        </label>

        {/* Strength indicator */}
        {form.password && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Strength: <span className="font-extrabold text-slate-700 dark:text-slate-350">{strengthText}</span></span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950 border dark:border-slate-800">
              <div className={`h-full ${strengthColor} transition-all duration-200`} style={{ width: `${(strength / 4) * 100}%` }} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition cursor-pointer"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-white" /> : <UserPlus className="h-4.5 w-4.5" />}
          Register Patient Profile
        </button>
      </form>

      <div className="my-4 flex items-center justify-between gap-3">
        <span className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs font-semibold text-slate-400">Already registered?</span>
        <span className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
        Back to portal sign in?{' '}
        <Link to="/login" className="font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-750 transition flex items-center justify-center gap-1 mt-1">
          Sign In Now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
    </div>
  )
}