import { Calendar, Clock3, FlaskConical, ShieldCheck, Users2, LoaderCircle, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { api } from '../lib/api.js'

const dashboardMeta = {
  ADMIN: {
    title: 'Admin Dashboard',
    description: 'System-wide control console. Manage user authentication, roles, security policies, and monitor system activities.',
  },
  RECEPTIONIST: {
    title: 'Reception Dashboard',
    description: 'Manage patient onboarding, front-desk intake registers, schedule listings, and pre-processing queues.',
  },
  TECHNICIAN: {
    title: 'Laboratory Dashboard',
    description: 'Analyze diagnostics requests, process specimens, input test readings, and sign off verified results.',
  },
  PATIENT: {
    title: 'Patient Dashboard',
    description: 'Welcome to your care space. Schedule test slots, view your diagnostics history, and manage medical settings.',
  },
}

export function DashboardPage({ role }) {
  const { user } = useAuth()
  const meta = dashboardMeta[role] || dashboardMeta.PATIENT

  const [stats, setStats] = useState({
    usersCount: 0,
    testsCount: 0,
    apptCount: 0,
    pendingInvoicesCount: 0,
    collectedSamplesCount: 0,
    completedReportsCount: 0,
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        if (role === 'ADMIN') {
          const [usersRes, testsRes, apptRes, auditRes] = await Promise.all([
            api.get('/users'),
            api.get('/tests'),
            api.get('/appointments/all'),
            api.get('/users/audit-logs')
          ])
          setStats({
            usersCount: usersRes.data.users?.length || 0,
            testsCount: testsRes.data.tests?.length || 0,
            apptCount: apptRes.data?.length || 0,
          })
          setAuditLogs(auditRes.data.logs?.slice(0, 8) || [])
        } else if (role === 'RECEPTIONIST') {
          const [apptRes, usersRes] = await Promise.all([
            api.get('/appointments/all'),
            api.get('/users')
          ])
          const patients = usersRes.data.users?.filter(u => u.role === 'PATIENT') || []
          setStats({
            usersCount: patients.length,
            apptCount: apptRes.data?.filter(a => a.status === 'SCHEDULED').length || 0,
            pendingInvoicesCount: apptRes.data?.filter(a => a.payment_status === 'PENDING').length || 0,
          })
        } else if (role === 'TECHNICIAN') {
          const [samplesRes, apptRes] = await Promise.all([
            api.get('/samples'),
            api.get('/appointments/all')
          ])
          setStats({
            collectedSamplesCount: samplesRes.data.samples?.filter(s => s.status === 'COLLECTED' || s.status === 'PROCESSING').length || 0,
            completedReportsCount: apptRes.data?.filter(a => a.status === 'COMPLETED').length || 0,
          })
        }
      } catch (err) {
        console.warn('Failed to load live statistics:', err.message)
      } finally {
        setLoadingStats(false)
      }
    }

    void fetchStats()
  }, [role])

  // Custom cards according to role stats
  const cards = useMemo(() => {
    if (role === 'ADMIN') {
      return [
        { label: 'System User Accounts', value: `${stats.usersCount} Registered`, icon: Users2 },
        { label: 'Diagnostic Catalog Directory', value: `${stats.testsCount} active tests`, icon: FlaskConical },
        { label: 'Diagnostic Bookings', value: `${stats.apptCount} appointments`, icon: Calendar },
      ]
    } else if (role === 'RECEPTIONIST') {
      return [
        { label: 'Patient Directory', value: `${stats.usersCount} onboarded`, icon: Users2 },
        { label: 'Scheduled Queue', value: `${stats.apptCount} slots`, icon: Clock3 },
        { label: 'Pending Invoices', value: `${stats.pendingInvoicesCount} invoices`, icon: Calendar },
      ]
    } else if (role === 'TECHNICIAN') {
      return [
        { label: 'Samples Queue', value: `${stats.collectedSamplesCount} specimens`, icon: FlaskConical },
        { label: 'Certified reports', value: `${stats.completedReportsCount} completed`, icon: ShieldCheck },
        { label: 'Security level', value: 'Technologist scope', icon: ShieldCheck },
      ]
    } else {
      return [
        { label: 'Account Profile', value: 'View and update your details', icon: Users2 },
        { label: 'Self-service', value: 'Manage diagnostics bookings', icon: ShieldCheck },
        { label: 'Care context', value: 'Personal laboratory account', icon: Calendar },
      ]
    }
  }, [role, stats])

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner - Solid White */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Welcome back,</p>
        <h2 className="mt-2 text-3.5xl font-extrabold tracking-tight text-slate-900">{meta.title}</h2>
        <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-500 font-medium">{meta.description}</p>

        {/* Info Grid Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div 
                key={card.label} 
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 hover:bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                  <p className="mt-1 text-base font-bold text-slate-900 leading-tight">{card.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Details Row */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Column: Admin Audit Logs OR Profile Specs */}
        {role === 'ADMIN' ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Security Audit Logs</h3>
                <p className="text-xs text-slate-500">Live system-wide activities monitor.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs">
              {loadingStats ? (
                <div className="flex items-center justify-center gap-3 p-8 text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Loading audit history...
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="divide-y divide-slate-150">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 flex justify-between gap-3 items-center hover:bg-slate-50/50">
                      <div>
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <p className="text-slate-500 mt-0.5">{log.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[9px] border border-blue-100">
                          {log.user_role || 'System'}
                        </span>
                        <p className="text-slate-400 mt-1 text-[10px]">{new Date(log.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-slate-500 text-center">No system actions audited yet.</p>
              )}
            </div>
          </section>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600 mb-4">Credentials & Status</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Full Name" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} />
              <Info label="Assigned Role" value={user?.role} highlight />
              <Info label="Email Address" value={user?.email} />
              <Info label="System Status" value={user?.isActive ? 'Active User' : 'Inactive'} status={user?.isActive} />
            </div>
          </div>
        )}

        {/* Right Column: Framework Capabilities */}
        <div className="rounded-3xl border border-blue-800 bg-gradient-to-br from-blue-900 to-blue-950 p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Subtle glow sphere */}
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-[50px] pointer-events-none" />

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">Framework Capabilities</p>
            <h3 className="mt-3 text-2.5xl font-bold leading-tight">LIS Core API is fully operational.</h3>
            <p className="mt-3 text-sm leading-relaxed text-blue-100 font-medium">
              The Laboratory Information System features live appointments bookings, receptionist demographic registries, invoicing checkout desks, and technician result transcription observations.
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-blue-300 font-bold tracking-wider uppercase">
            Laboratory Information System • All Modules Ready
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, highlight, status }) {
  const isStatus = status !== undefined

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-350/80 transition-all duration-300">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {isStatus ? (
        <div className="mt-2.5 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <p className="text-sm font-bold text-slate-800">{value}</p>
        </div>
      ) : (
        <p className={`mt-2 text-sm font-bold ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>
          {value || 'Not provided'}
        </p>
      )}
    </div>
  )
}