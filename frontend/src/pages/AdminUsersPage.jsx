import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, PlusCircle, Search, ShieldAlert, UserRoundCog, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api.js'

const roleOptions = ['RECEPTIONIST', 'TECHNICIAN']

export function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data.users)
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users

    return users.filter((user) => {
      const searchable = [user.firstName, user.lastName, user.email, user.role].join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [search, users])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.post('/users', form)
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' })
      setMessage('User created successfully.')
      await loadUsers()
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to create user.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (userId, isActive) => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.patch(`/users/${userId}/status`, { isActive })
      setMessage(`User status updated successfully.`)
      await loadUsers()
    } catch (toggleError) {
      setError(toggleError?.response?.data?.message || 'Unable to update status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Admin Controls</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Staff Account Management</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium">
              Create and manage authentication settings for receptionists, technologists, and administrational roles.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff or patients" className="border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-350 font-medium" />
          </label>
        </div>

        {message ? <Banner tone="success" text={message} /> : null}
        {error ? <Banner tone="error" text={error} /> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        
        {/* Create Staff Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <PlusCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create Staff Account</h3>
                <p className="text-xs text-slate-500 font-medium">Configure receptionist and laboratory technician logins</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="First Name" value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} placeholder="John" />
              <TextField label="Last Name" value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} placeholder="Doe" />
            </div>
            
            <TextField label="Email Address" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="staff@gmail.com" />
            <TextField label="Phone Number" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} placeholder="07xxxxxxxx" />
            <TextField label="Temporary Password" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder="••••••••" />

            <label className="block space-y-1.5 w-full font-semibold">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Access Role</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition duration-150">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition mt-4">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserRoundCog className="h-4 w-4" />}
            Create User Account
          </button>
        </form>

        {/* Directory List */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Registered Accounts Directory</h3>
              <p className="text-xs text-slate-500 font-medium">Review status and activate/deactivate user access</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" /> Loading account list...
              </div>
            ) : filteredUsers.length ? (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
                  
                  return (
                    <div key={user.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50/50 transition">
                      <div className="flex items-center gap-3">
                        {/* Circular Initials Bubble */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-650 border border-slate-200/50">
                          {initials || 'U'}
                        </div>
                        <div className="min-w-0 font-semibold">
                          <p className="font-extrabold text-slate-900 text-sm truncate leading-tight">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-450 truncate mt-0.5">{user.email}</p>
                          <span className="inline-block mt-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-blue-700 border border-blue-100/50 uppercase tracking-wider">
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-between md:justify-end">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                        
                        {/* Allow toggling active state except for system Admin */}
                        {user.role !== 'ADMIN' && (
                          <button 
                            type="button" 
                            disabled={saving} 
                            onClick={() => toggleStatus(user.id, !user.isActive)} 
                            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-705 disabled:opacity-60 transition"
                          >
                            {user.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">No registered accounts found matching search filters.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block space-y-1.5 w-full font-semibold">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input 
        type={type} 
        value={value || ''} 
        onChange={(event) => onChange(event.target.value)} 
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-350 transition duration-150" 
      />
    </label>
  )
}

function Banner({ tone, text }) {
  return tone === 'success' ? (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{text}</div>
  ) : (
    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{text}</div>
  )
}