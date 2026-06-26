import { Calendar, Clock3, FlaskConical, ShieldCheck, Users2 } from 'lucide-react'
import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth.js'

const dashboardMeta = {
  ADMIN: {
    title: 'Admin dashboard',
    description: 'Manage users, assign roles, and keep the LIS secure.',
    cards: [
      { label: 'User management', value: 'Create and control accounts', icon: Users2 },
      { label: 'Security', value: 'RBAC and audit logs enabled', icon: ShieldCheck },
      { label: 'Operational scope', value: 'All laboratory roles', icon: FlaskConical },
    ],
  },
  RECEPTIONIST: {
    title: 'Reception dashboard',
    description: 'Support patient flow and prepare records for clinical workflows.',
    cards: [
      { label: 'Queue visibility', value: 'Future reception workflows', icon: Users2 },
      { label: 'Time management', value: 'Fast onboarding and lookups', icon: Clock3 },
      { label: 'Patient intake', value: 'Structured front-desk access', icon: Calendar },
    ],
  },
  TECHNICIAN: {
    title: 'Laboratory dashboard',
    description: 'Track lab processing and keep test operations organized.',
    cards: [
      { label: 'Processing', value: 'Sample and result workflows', icon: FlaskConical },
      { label: 'Turnaround', value: 'Task visibility by priority', icon: Clock3 },
      { label: 'Access', value: 'Restricted technician scope', icon: ShieldCheck },
    ],
  },
  PATIENT: {
    title: 'Patient dashboard',
    description: 'View your profile and access upcoming patient self-service features.',
    cards: [
      { label: 'Profile access', value: 'View and update your details', icon: Users2 },
      { label: 'Self-service', value: 'Prepared for future modules', icon: ShieldCheck },
      { label: 'Care context', value: 'Personal laboratory account', icon: Calendar },
    ],
  },
}

export function DashboardPage({ role }) {
  const { user } = useAuth()
  const meta = dashboardMeta[role] || dashboardMeta.PATIENT
  const cards = useMemo(() => meta.cards, [meta])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">Welcome back</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{meta.title}</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{meta.description}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <Icon className="h-5 w-5 text-sky-700" />
                <p className="mt-3 text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{card.value}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Account summary</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Info label="Name" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} />
            <Info label="Role" value={user?.role} />
            <Info label="Email" value={user?.email} />
            <Info label="Status" value={user?.isActive ? 'Active' : 'Inactive'} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-slate-900 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Module status</p>
          <h3 className="mt-3 text-2xl font-semibold">Authentication foundation is ready.</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            This module establishes secure login, patient onboarding, protected routing, and role-aware navigation for the rest of the laboratory system.
          </p>
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value || 'Not provided'}</p>
    </div>
  )
}