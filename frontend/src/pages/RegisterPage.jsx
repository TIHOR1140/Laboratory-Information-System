import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, LoaderCircle, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, getDashboardPath } = useAuth()
  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: 'Male', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
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

    try {
      const session = await register(form)
      navigate(getDashboardPath(session.user.role), { replace: true })
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="e.g. John Doe"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-350 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date of Birth</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((c) => ({ ...c, dateOfBirth: e.target.value }))}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gender</span>
            <select
              value={form.gender}
              onChange={(e) => setForm((c) => ({ ...c, gender: e.target.value }))}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            placeholder="john@example.com"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-350 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone Number</span>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            placeholder="07xxxxxxxx"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-350 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            placeholder="••••••••"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-350 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
          />
          <span className="text-[10px] text-slate-400 block mt-1 tracking-tight">At least 8 characters, containing uppercase, lowercase, and a number.</span>
        </label>

        {/* Strength indicator */}
        {form.password && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xxs font-bold uppercase tracking-wider text-slate-400">
              <span>Strength: <span className="font-extrabold text-slate-700">{strengthText}</span></span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border">
              <div className={`h-full ${strengthColor} transition-all duration-200`} style={{ width: `${(strength / 4) * 100}%` }} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-white" /> : <UserPlus className="h-4.5 w-4.5" />}
          Register Patient Profile
        </button>
      </form>

      <div className="my-4 flex items-center justify-between gap-3">
        <span className="h-[1px] flex-1 bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400">Already registered?</span>
        <span className="h-[1px] flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-sm text-slate-600 font-medium">
        Back to portal sign in?{' '}
        <Link to="/login" className="font-extrabold text-blue-600 hover:text-blue-750 transition flex items-center justify-center gap-1 mt-1">
          Sign In Now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
    </div>
  )
}