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
    <div style={S.page}>
      {/* Sky cloud blobs */}
      <div style={{ ...S.blob, ...S.blob1 }} />
      <div style={{ ...S.blob, ...S.blob2 }} />
      <div style={{ ...S.blob, ...S.blob3 }} />

      {/* Card */}
      <div style={S.card}>
        {/* Icon badge */}
        <div style={S.iconBadge}>
          <LogIn size={20} color="#1e293b" strokeWidth={2.2} />
        </div>

        <h1 style={S.heading}>Sign in with email</h1>
        <p style={S.subheading}>
          Secure access to your Laboratory Information System account
        </p>

        {/* Error */}
        {error && <div style={S.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={S.form}>
          {/* Email input */}
          <div
            style={S.inputRow}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#7dd3fc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(125,211,252,0.2)' }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Mail size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
              autoComplete="email"
              placeholder="Email"
              required
              style={S.input}
            />
          </div>

          {/* Password input */}
          <div
            style={S.inputRow}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#7dd3fc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(125,211,252,0.2)' }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Lock size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
              autoComplete="current-password"
              placeholder="Password"
              required
              style={S.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword((c) => !c)}
              style={S.eyeBtn}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#94a3b8" />}
            </button>
          </div>

          {/* Forgot password */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={S.forgotBtn}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{ ...S.submitBtn, opacity: loading ? 0.72 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1e3a5f' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#0f172a' }}
          >
            {loading && <LoaderCircle size={15} style={{ animation: 'lis-spin 1s linear infinite' }} />}
            {loading ? 'Signing in…' : 'Get Started'}
          </button>
        </form>

        {/* Divider + register link */}
        <div style={S.divider}>
          <span style={S.divLine} />
          <span style={S.divText}>New patient?</span>
          <span style={S.divLine} />
        </div>
        <p style={S.regText}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={S.regLink}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#0ea5e9')}
          >
            Create account
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes lis-spin    { to { transform: rotate(360deg); } }
        @keyframes lis-floatIn { from { opacity:0; transform:translateY(24px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}

/* ── styles ── */
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(155deg,#bfdbfe 0%,#e0f2fe 30%,#f0f9ff 58%,#dbeafe 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '1.5rem',
  },
  blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', opacity: .55, pointerEvents: 'none' },
  blob1: { width: 540, height: 320, background: 'radial-gradient(circle,#e0f2fe,#bae6fd)', top: '-90px', left: '-130px' },
  blob2: { width: 420, height: 280, background: 'radial-gradient(circle,#f0f9ff,#e0f2fe)', bottom: '-70px', right: '-90px' },
  blob3: { width: 300, height: 210, background: 'radial-gradient(circle,#eff6ff,#dbeafe)', top: '44%', left: '63%', transform: 'translateY(-50%)' },
  card: {
    position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px',
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.86)',
    boxShadow: '0 28px 80px rgba(15,23,42,0.14),0 6px 20px rgba(15,23,42,0.07)',
    padding: '3rem 3rem 2.5rem',
    textAlign: 'center',
    animation: 'lis-floatIn .42s cubic-bezier(.22,1,.36,1) both',
  },
  iconBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '62px', height: '62px', borderRadius: '16px',
    background: 'rgba(255,255,255,0.90)',
    border: '1px solid rgba(226,232,240,0.9)',
    boxShadow: '0 2px 10px rgba(15,23,42,0.09)',
    marginBottom: '1.4rem',
  },
  heading: { margin: '0 0 .55rem', fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em', lineHeight: 1.25 },
  subheading: { margin: '0 0 1.8rem', fontSize: '.93rem', color: '#64748b', lineHeight: 1.65 },
  errorBox: {
    marginBottom: '.9rem', padding: '.6rem .9rem', borderRadius: '11px',
    background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c',
    fontSize: '.82rem', textAlign: 'left',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '.8rem', textAlign: 'left' },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: '.6rem',
    background: 'rgba(248,250,252,0.88)',
    border: '1px solid #e2e8f0', borderRadius: '13px',
    padding: '0 1rem', height: '52px',
    transition: 'border-color .18s,box-shadow .18s',
  },
  input: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: '#0f172a', minWidth: 0 },
  eyeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '.2rem', display: 'flex', alignItems: 'center', flexShrink: 0 },
  forgotBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '.88rem', color: '#64748b', padding: 0, transition: 'color .15s' },
  submitBtn: {
    marginTop: '.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
    width: '100%', padding: '1rem', borderRadius: '13px',
    background: '#0f172a', color: '#fff',
    fontSize: '1rem', fontWeight: 600, border: 'none',
    letterSpacing: '.01em', transition: 'background .18s',
    boxShadow: '0 4px 16px rgba(15,23,42,0.28)',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '.8rem', margin: '1.6rem 0 .9rem' },
  divLine: { flex: 1, height: '1px', background: 'rgba(226,232,240,0.85)' },
  divText: { fontSize: '.85rem', color: '#94a3b8', whiteSpace: 'nowrap' },
  regText: { margin: 0, fontSize: '.92rem', color: '#64748b' },
  regLink: { color: '#0ea5e9', fontWeight: 600, textDecoration: 'none', transition: 'color .15s' },
}