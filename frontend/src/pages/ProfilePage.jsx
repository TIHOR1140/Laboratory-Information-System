import { useEffect, useState } from 'react'
import { LoaderCircle, Lock, Save, UserRound, ShieldCheck, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

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

  const initials = `${profile.firstName?.[0] || user?.firstName?.[0] || ''}${profile.lastName?.[0] || user?.lastName?.[0] || ''}`.toUpperCase()

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
      } catch {
        setError('Unable to load profile details.')
      }
    }

    void load()
  }, [refreshProfile, user?.firstName, user?.lastName])

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
      await changePassword(password)
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage('Password changed successfully.')
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150"
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