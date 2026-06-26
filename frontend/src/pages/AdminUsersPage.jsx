import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, PlusCircle, Search, ShieldAlert, UserRoundCog } from 'lucide-react'
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
      setMessage(`User ${isActive ? 'activated' : 'deactivated'} successfully.`)
      await loadUsers()
    } catch (toggleError) {
      setError(toggleError?.response?.data?.message || 'Unable to update status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Admin user management</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create and control staff accounts</h2>
            <p className="mt-3 max-w-3xl text-slate-600">
              Admins can create additional admins, receptionists, and laboratory technicians, then activate or deactivate access.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="border-0 bg-transparent outline-none" />
          </label>
        </div>

        {message ? <Banner tone="success" text={message} /> : null}
        {error ? <Banner tone="error" text={error} /> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <PlusCircle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Create staff account</h3>
              <p className="text-sm text-slate-600">Only receptionist and technician accounts are created here.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First Name" value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
            <TextField label="Last Name" value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
          </div>
          <TextField label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextField label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <TextField label="Temporary Password" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 disabled:opacity-70">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserRoundCog className="h-4 w-4" />}
            Create User
          </button>
        </form>

        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Registered users</h3>
              <p className="text-sm text-slate-600">Review current access and activation state.</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-8 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" /> Loading users
              </div>
            ) : filteredUsers.length ? (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{user.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={user.isActive ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button type="button" disabled={saving} onClick={() => toggleStatus(user.id, !user.isActive)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60">
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No users match the current filter.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
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