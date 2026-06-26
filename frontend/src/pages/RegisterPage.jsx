import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Eye, EyeOff, Lock, LoaderCircle, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, getDashboardPath } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    email: '',
    phone: '',
    password: '',
  })

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth])
  const passwordScore = useMemo(() => getPasswordScore(form.password), [form.password])
  const errors = validate(form, age)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  const handleBlur = (event) => {
    setTouched((current) => ({ ...current, [event.target.name]: true }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched(Object.keys(form).reduce((accumulator, key) => ({ ...accumulator, [key]: true }), {}))

    if (Object.keys(errors).length > 0) {
      setError('Please complete the highlighted fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const session = await register(form)
      navigate(getDashboardPath(session.user.role), { replace: true })
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to create the account right now.')
    } finally {
      setLoading(false)
    }
  }

  const showError = (field) => touched[field] && errors[field]

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Field label="Full Name" error={showError('name')}>
        <InputIcon icon={UserRound}>
          <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} placeholder="John Doe" />
        </InputIcon>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of Birth" error={showError('dateOfBirth')}>
          <InputIcon icon={CalendarDays}>
            <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} onBlur={handleBlur} />
          </InputIcon>
        </Field>

        <Field label="Age" hint="Calculated from date of birth">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
            {Number.isFinite(age) ? `${age} years` : 'Enter date of birth'}
          </div>
        </Field>
      </div>

      <Field label="Gender" error={showError('gender')}>
        <select name="gender" value={form.gender} onChange={handleChange} onBlur={handleBlur} className="input-base">
          {genderOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email Address" error={showError('email')}>
          <InputIcon icon={Mail}>
            <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} placeholder="patient@example.com" />
          </InputIcon>
        </Field>

        <Field label="Phone Number" error={showError('phone')}>
          <InputIcon icon={Phone}>
            <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} placeholder="07xxxxxxxx" />
          </InputIcon>
        </Field>
      </div>

      <Field label="Password" error={showError('password')} hint="At least 8 characters, upper and lower case, and one number">
        <PasswordField
          name="password"
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          showPassword={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
        />
        <PasswordStrength score={passwordScore} />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Create Account
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
          Back to Sign In
        </Link>
      </p>
    </form>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  )
}

function InputIcon({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
      <Icon className="h-4 w-4 text-slate-400" />
      {children}
    </div>
  )
}

function PasswordField({ showPassword, onToggle, ...props }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
      <Lock className="h-4 w-4 text-slate-400" />
      <input {...props} type={showPassword ? 'text' : 'password'} className="w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400" />
      <button type="button" onClick={onToggle} className="text-slate-500 transition hover:text-slate-900">
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function PasswordStrength({ score }) {
  const labels = ['Weak', 'Fair', 'Strong', 'Very strong']
  const widths = ['25%', '50%', '75%', '100%']
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500']
  const index = Math.max(score - 1, 0)

  return (
    <div className="space-y-2 pt-1">
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${colors[index]}`} style={{ width: widths[index] }} />
      </div>
      <p className="text-xs text-slate-500">Password strength: {labels[index]}</p>
    </div>
  )
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null

  const birthDate = new Date(dateOfBirth)
  const now = new Date()

  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDifference = now.getMonth() - birthDate.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function getPasswordScore(password) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  return Math.max(1, score)
}

function validate(form, age) {
  const errors = {}

  if (!form.name || form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'
  if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.'
  if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date()) errors.dateOfBirth = 'Date of birth cannot be in the future.'
  if (age !== null && age < 0) errors.dateOfBirth = 'Date of birth is invalid.'
  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'
  if (!form.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
    errors.password = 'Password must include 8 characters, an uppercase letter, a lowercase letter, and a number.'
  }

  return errors
}