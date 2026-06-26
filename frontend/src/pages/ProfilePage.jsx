import { useEffect, useState } from 'react'
import { LoaderCircle, Lock, Save, UserRound } from 'lucide-react'
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

    load()
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
      setError(submitError?.response?.data?.message || 'Unable to update profile.')
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
      setError(submitError?.response?.data?.message || 'Unable to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleProfileSubmit} className="space-y-5 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <SectionHeader title="Profile information" icon={UserRound} description="Update your contact and patient details." />
        {message ? <Notice tone="success" text={message} /> : null}
        {error ? <Notice tone="error" text={error} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First Name" value={profile.firstName} onChange={(value) => setProfile((current) => ({ ...current, firstName: value }))} />
          <TextField label="Last Name" value={profile.lastName} onChange={(value) => setProfile((current) => ({ ...current, lastName: value }))} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone" value={profile.phone} onChange={(value) => setProfile((current) => ({ ...current, phone: value }))} />
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

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 disabled:opacity-70">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-5 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <SectionHeader title="Change password" icon={Lock} description="Keep your account secure with a strong new password." />
        <TextField label="Current password" type="password" value={password.currentPassword} onChange={(value) => setPassword((current) => ({ ...current, currentPassword: value }))} />
        <TextField label="New password" type="password" value={password.newPassword} onChange={(value) => setPassword((current) => ({ ...current, newPassword: value }))} />
        <TextField label="Confirm new password" type="password" value={password.confirmPassword} onChange={(value) => setPassword((current) => ({ ...current, confirmPassword: value }))} />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-700/20 disabled:opacity-70">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Update password
        </button>
      </form>
    </div>
  )
}

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows="4"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  )
}

function Notice({ tone, text }) {
  return tone === 'success' ? (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{text}</div>
  ) : (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{text}</div>
  )
}