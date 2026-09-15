import { useEffect, useState } from 'react'
import { LoaderCircle, Lock, Save, UserRound, ShieldCheck, Mail, Monitor, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { api } from '../lib/api.js'

const parseUA = (ua) => {
  if (!ua) return 'Unknown Device'
  let os = 'Unknown OS'
  let browser = 'Unknown Browser'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'

  if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Google Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari'
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox'
  else if (ua.includes('Edg')) browser = 'Microsoft Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  return `${browser} on ${os}`
}

export function ProfilePage() {
  const { user, refreshProfile, updateProfile, changePassword } = useAuth()
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    emergencyContactNumber: '',
    streetAddress: '',
    city: '',
    district: '',
    bloodGroup: '',
    allergies: '',
    medicalNotes: '',
  })
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Two-Factor Authentication states
  const [mfaMethod, setMfaMethod] = useState('TOTP')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaSetup, setMfaSetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [mfaSuccess, setMfaSuccess] = useState('')
  const [sendingCode, setSendingCode] = useState(false)

  // Active Sessions states
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const initials = `${profile.firstName?.[0] || user?.firstName?.[0] || ''}${profile.lastName?.[0] || user?.lastName?.[0] || ''}`.toUpperCase()

  const fetchSessions = async () => {
    setSessionsLoading(true)
    try {
      const response = await api.get('/profile/sessions')
      setSessions(response.data.sessions || [])
    } catch (err) {
      console.error('Failed to load active sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const response = await refreshProfile()
        setProfile({
          firstName: response.user.firstName || user?.firstName || '',
          lastName: response.user.lastName || user?.lastName || '',
          phone: response.user.phone || '',
          emergencyContactNumber: response.patient?.emergencyContact || '',
          streetAddress: response.patient?.streetAddress || '',
          city: response.patient?.city || '',
          district: response.patient?.district || '',
          bloodGroup: response.patient?.bloodGroup || '',
          allergies: response.patient?.allergies || '',
          medicalNotes: response.patient?.medicalNotes || '',
        })
        await fetchSessions()
      } catch {
        setError('Unable to load profile details.')
      }
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await updateProfile(profile)
      setMessage('Profile updated successfully.')
    } catch (submitError) {
      const serverMessage = submitError?.response?.data?.message
      const serverErrors = submitError?.response?.data?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        const errorDetails = Object.entries(serverErrors)
          .map(([field, msg]) => msg)
          .join(' ')
        setError(`${serverMessage ? `${serverMessage}: ` : ''}${errorDetails}`)
      } else {
        setError(serverMessage || 'Unable to update profile.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await changePassword(password)
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage(response.message || 'Password changed successfully.')
      await fetchSessions() // Refresh active sessions since others were signed out
    } catch (submitError) {
      const serverMessage = submitError?.response?.data?.message
      const serverErrors = submitError?.response?.data?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        const errorDetails = Object.entries(serverErrors)
          .map(([field, msg]) => msg)
          .join(' ')
        setError(`${serverMessage ? `${serverMessage}: ` : ''}${errorDetails}`)
      } else {
        setError(serverMessage || 'Unable to change password.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleStartMfaSetup = async () => {
    setMfaLoading(true)
    setMfaError('')
    setMfaSuccess('')
    try {
      const response = await api.post('/auth/setup-2fa', { method: mfaMethod })
      if (response.data?.secret) {
        setTotpSecret(response.data.secret)
      }
      if (mfaMethod === 'TOTP') {
        setQrCode(response.data.qrCodeDataUrl)
      }
      setMfaSetup(true)
      setMfaCode('')
    } catch (err) {
      setMfaError(err?.response?.data?.message || 'Failed to initialize 2FA setup.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleConfirmMfaSetup = async () => {
    setMfaLoading(true)
    setMfaError('')
    setMfaSuccess('')
    try {
      const response = await api.post('/auth/confirm-2fa', {
        code: mfaCode,
        token: mfaCode,
        secret: totpSecret,
        method: mfaMethod,
      })
      setMfaSetup(false)
      setMfaCode('')
      setMfaSuccess(response.data.message || '2FA enabled successfully.')
      await refreshProfile()
    } catch (err) {
      setMfaError(err?.response?.data?.message || 'Verification failed. Please check the code.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setMfaLoading(true)
    setMfaError('')
    setMfaSuccess('')
    try {
      const response = await api.post('/auth/disable-2fa', { code: mfaCode })
      setMfaCode('')
      setMfaSuccess(response.data.message || '2FA disabled successfully.')
      await refreshProfile()
    } catch (err) {
      setMfaError(err?.response?.data?.message || 'Failed to disable 2FA. Please verify the code.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleRequestDisableCode = async () => {
    setSendingCode(true)
    setMfaError('')
    setMfaSuccess('')
    try {
      const response = await api.post('/auth/request-disable-2fa')
      setMfaSuccess(response.data.message || 'Verification code sent to your email.')
    } catch (err) {
      setMfaError(err?.response?.data?.message || 'Failed to send verification code. Please try again.')
    } finally {
      setSendingCode(false)
    }
  }

  const handleRevokeSession = async (jti) => {
    try {
      await api.post('/profile/sessions/revoke', { jti })
      await fetchSessions()
    } catch (err) {
      console.error('Failed to revoke session:', err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Profile Identity Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-extrabold text-white shadow-md shadow-blue-600/15">
          {initials || 'U'}
        </div>
        <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0 font-semibold">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {profile.firstName} {profile.lastName}
          </h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-slate-500 font-bold mt-0.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="h-4 w-4 text-slate-400" />
              {user?.email}
            </span>
            <span className="inline-block h-3 w-[1px] bg-slate-200" />
            <span className="flex items-center gap-1.5 text-blue-600">
              <ShieldCheck className="h-4 w-4" />
              {user?.role} Access Mode
            </span>
            {profile?.patientCode && (
              <>
                <span className="inline-block h-3 w-[1px] bg-slate-200" />
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 text-xs font-extrabold">
                  ID: {profile.patientCode}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {message ? <Notice tone="success" text={message} /> : null}
      {error ? <Notice tone="error" text={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Profile Info Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <SectionHeader title="Profile Information" icon={UserRound} description="Update your contact, emergency, and patient details." />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First Name" value={profile.firstName} onChange={(value) => setProfile((current) => ({ ...current, firstName: value }))} />
            <TextField label="Last Name" value={profile.lastName} onChange={(value) => setProfile((current) => ({ ...current, lastName: value }))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Phone Number" value={profile.phone} onChange={(value) => setProfile((current) => ({ ...current, phone: value }))} />
            <TextField label="Emergency Contact" value={profile.emergencyContactNumber} onChange={(value) => setProfile((current) => ({ ...current, emergencyContactNumber: value }))} />
          </div>

          <TextAreaField label="Street Address" value={profile.streetAddress} onChange={(value) => setProfile((current) => ({ ...current, streetAddress: value }))} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="City" value={profile.city} onChange={(value) => setProfile((current) => ({ ...current, city: value }))} />
            <TextField label="District" value={profile.district} onChange={(value) => setProfile((current) => ({ ...current, district: value }))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Blood Group" value={profile.bloodGroup} onChange={(value) => setProfile((current) => ({ ...current, bloodGroup: value }))} />
            <TextField label="Allergies" value={profile.allergies} onChange={(value) => setProfile((current) => ({ ...current, allergies: value }))} />
          </div>

          <TextAreaField label="Medical Notes" value={profile.medicalNotes} onChange={(value) => setProfile((current) => ({ ...current, medicalNotes: value }))} />

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-75">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </form>

        {/* Right Stack containing Password Form, 2FA Settings Card, and Active Sessions Card */}
        <div className="space-y-6">
          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm h-max">
            <SectionHeader title="Change Password" icon={Lock} description="Keep your account secure with a strong new password." />

            <TextField label="Current Password" type="password" value={password.currentPassword} onChange={(value) => setPassword((current) => ({ ...current, currentPassword: value }))} />
            <TextField label="New Password" type="password" value={password.newPassword} onChange={(value) => setPassword((current) => ({ ...current, newPassword: value }))} />
            <TextField label="Confirm New Password" type="password" value={password.confirmPassword} onChange={(value) => setPassword((current) => ({ ...current, confirmPassword: value }))} />

            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-75 w-full justify-center">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update Password
            </button>
          </form>

          {/* Two-Factor Authentication Configuration Card */}
          <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <SectionHeader 
              title="Two-Factor Authentication" 
              icon={ShieldCheck} 
              description="Protect your account with a secondary verification passcode." 
            />

            {user?.twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-emerald-800 font-semibold text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p>2FA is currently ENABLED</p>
                    <p className="text-xs text-emerald-600 font-normal">Method: {user.twoFactorMethod === 'EMAIL' ? 'Email OTP' : 'Authenticator App (TOTP)'}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Disable 2FA</p>
                  {user?.twoFactorMethod === 'EMAIL' && (
                    <div className="flex flex-col gap-1.5 pb-1">
                      <p className="text-xxs text-slate-500 font-medium leading-relaxed">
                        To disable 2FA, please request a verification code sent to your email address: <strong>{user.email}</strong>.
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={handleRequestDisableCode}
                          disabled={sendingCode}
                          className="rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 transition disabled:opacity-75"
                        >
                          {sendingCode ? 'Sending...' : 'Send Verification Code'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="w-full max-w-[160px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 transition font-bold tracking-widest text-center"
                    />
                    <button
                      onClick={handleDisable2FA}
                      disabled={mfaLoading || !mfaCode}
                      className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-rose-700 transition disabled:opacity-75"
                    >
                      {mfaLoading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                  {mfaError && <p className="text-xs font-semibold text-rose-600">{mfaError}</p>}
                  {mfaSuccess && <p className="text-xs font-semibold text-emerald-600">{mfaSuccess}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!mfaSetup ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Two-Factor Authentication is currently disabled. Choose a verification method to configure:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition select-none ${mfaMethod === 'TOTP' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="TOTP"
                          checked={mfaMethod === 'TOTP'}
                          onChange={() => setMfaMethod('TOTP')}
                          className="mt-1 h-4 w-4 text-blue-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Authenticator App</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">Use mobile apps like Google Authenticator or Microsoft Authenticator.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition select-none ${mfaMethod === 'EMAIL' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="EMAIL"
                          checked={mfaMethod === 'EMAIL'}
                          onChange={() => setMfaMethod('EMAIL')}
                          className="mt-1 h-4 w-4 text-blue-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Email OTP Code</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">Receive a 6-digit confirmation code directly to your email inbox.</p>
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={handleStartMfaSetup}
                      disabled={mfaLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                    >
                      {mfaLoading ? 'Starting Setup...' : 'Setup 2FA Security'}
                    </button>
                    {mfaError && <p className="text-xs font-semibold text-rose-600">{mfaError}</p>}
                    {mfaSuccess && <p className="text-xs font-semibold text-emerald-600">{mfaSuccess}</p>}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <p className="text-xs font-bold text-slate-900">
                        Confirming {mfaMethod === 'EMAIL' ? 'Email OTP' : 'Authenticator App'} Setup
                      </p>
                      <button 
                        type="button"
                        onClick={() => {
                          setMfaSetup(false)
                          setMfaError('')
                          setMfaSuccess('')
                        }} 
                        className="text-xxs font-bold text-slate-400 hover:text-slate-600 uppercase"
                      >
                        Cancel
                      </button>
                    </div>

                    {mfaMethod === 'TOTP' && qrCode && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
                        <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm shrink-0">
                          <img src={qrCode} alt="TOTP QR Code" className="h-24 w-24 object-contain" />
                        </div>
                        <div className="space-y-1.5 text-xxs text-slate-600 font-medium">
                          <p className="font-bold text-slate-900 text-xs">Scan QR Code</p>
                          <p>1. Scan the QR code with your Authenticator App.</p>
                          <p>2. Or key in the secret string manually:</p>
                          <p className="bg-slate-100 p-1.5 rounded-md font-mono font-bold text-slate-700 text-center select-all tracking-wider text-[10px]">{totpSecret}</p>
                        </div>
                      </div>
                    )}

                    {mfaMethod === 'EMAIL' && (
                      <div className="py-1 text-xxs text-slate-600 font-medium">
                        <p className="font-bold text-slate-900 text-xs mb-0.5">Check Your Inbox</p>
                        <p>We have dispatched a 6-digit confirmation code to: <span className="font-bold text-slate-800">{user?.email}</span>.</p>
                      </div>
                    )}

                    <div className="space-y-2.5 pt-1">
                      <label className="block space-y-1.5 w-full font-semibold">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">6-Digit Passcode</span>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          className="w-full max-w-[160px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 transition font-bold tracking-widest text-center"
                        />
                      </label>

                      <button
                        onClick={handleConfirmMfaSetup}
                        disabled={mfaLoading || !mfaCode}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-75"
                      >
                        {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                      </button>
                    </div>

                    {mfaError && <p className="text-xs font-semibold text-rose-600">{mfaError}</p>}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Active Sessions Panel */}
          <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <SectionHeader 
              title="Active Sessions" 
              icon={Monitor} 
              description="Track and manage the devices currently logged into your account." 
            />

            <div className="space-y-4">
              {sessionsLoading && sessions.length === 0 ? (
                <div className="flex justify-center py-6 text-slate-400">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sessions.map((sess) => (
                    <div key={sess.jti} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${sess.isCurrent ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                          <Monitor className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-slate-800 truncate">{parseUA(sess.userAgent)}</p>
                            {sess.isCurrent && (
                              <span className="inline-flex rounded-full bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-600 uppercase tracking-wide">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            IP: {sess.ipAddress || 'Unknown'} • Logged in {new Date(sess.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(sess.jti)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-400 hover:text-rose-600 transition shadow-xs shrink-0"
                          title="Revoke session"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block space-y-1.5 w-full font-semibold">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-955 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="block space-y-1.5 w-full font-semibold">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows="3"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-955 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
      />
    </label>
  )
}

function Notice({ tone, text }) {
  return tone === 'success' ? (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{text}</div>
  ) : (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{text}</div>
  )
}