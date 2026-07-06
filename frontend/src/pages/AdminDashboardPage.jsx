import { Activity, FlaskConical, PlusCircle, ShieldCheck, Users2, TestTube2, FileText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

// Administrative overview for monitoring staff, tests, and high-value workflow actions.
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { AdminBanner, AdminSpinner } from '../components/admin/AdminUi.jsx'

const quickActions = [
  { label: 'Create receptionist', to: '/admin/users', icon: PlusCircle, description: 'Add a new front-desk staff account.' },
  { label: 'Create technician', to: '/admin/users', icon: PlusCircle, description: 'Grant lab staff access to the workflow.' },
  { label: 'Manage tests', to: '/admin/tests', icon: TestTube2, description: 'Create and update laboratory test catalog entries.' },
  { label: 'Templates', to: '/admin/templates', icon: FileText, description: 'Maintain report layouts and branding.' },
]

export function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, tests: 0 })
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = async () => {
    try {
      setLoading(true)
      const [usersResponse, testsResponse, activityResponse] = await Promise.all([
        api.get('/users'),
        api.get('/admin/tests'),
        api.get('/admin/activity'),
      ])

      setStats({
        users: usersResponse.data.users?.length || 0,
        tests: testsResponse.data.tests?.length || 0,
      })
      setActivity(activityResponse.data.activity || [])
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load admin overview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [])

  const cards = useMemo(
    () => [
      { label: 'Total users', value: stats.users, icon: Users2, accent: 'sky' },
      { label: 'Total tests', value: stats.tests, icon: FlaskConical, accent: 'emerald' },
      { label: 'Access control', value: 'Role-based', icon: ShieldCheck, accent: 'slate' },
    ],
    [stats],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Administrative overview</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Operate the laboratory with a complete admin command center</h2>
        <p className="mt-3 max-w-3xl text-slate-600">Monitor staff access, maintain the test catalogue, and shape report templates from one place.</p>
      </section>

      {error ? <AdminBanner tone="error" text={error} /> : null}

      {loading ? (
        <AdminSpinner text="Loading admin overview" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon
              const accentClasses = {
                sky: 'bg-sky-50 text-sky-700',
                emerald: 'bg-emerald-50 text-emerald-700',
                slate: 'bg-slate-100 text-slate-700',
              }[card.accent]

              return (
                <div key={card.label} className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accentClasses}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{card.value}</p>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Recent activity</h3>
                  <p className="text-sm text-slate-600">Latest admin actions and updates.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {activity.length ? (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-sky-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                        <p className="text-sm text-slate-600">{item.description}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No recent activity yet.</div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <PlusCircle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Quick actions</h3>
                  <p className="text-sm text-slate-600">Jump into common admin workflows.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link key={action.label} to={action.to} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/70">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{action.label}</p>
                          <p className="text-sm text-slate-600">{action.description}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
