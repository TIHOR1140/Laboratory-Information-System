import { useEffect, useState } from 'react'
import { ShieldCheck, UserX, LoaderCircle, AlertCircle, RefreshCw, Activity, Terminal } from 'lucide-react'
import { api } from '../lib/api.js'

export function AdminSecurityPage() {
  const [sessions, setSessions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [sessionsRes, logsRes] = await Promise.all([
        api.get('/admin/sessions'),
        api.get('/admin/audit-logs-full'),
      ])
      setSessions(sessionsRes.data.sessions || [])
      setAuditLogs(logsRes.data.auditLogs || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to retrieve security status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleRevoke = async (jti) => {
    if (!window.confirm('Are you sure you want to revoke this session? The user will be signed out immediately.')) {
      return
    }

    setActionError('')
    setSuccess('')
    try {
      await api.delete(`/admin/sessions/${jti}`)
      setSuccess('User session revoked successfully.')
      await loadData()
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to revoke user session.')
    }
  }

  // Parse User Agent to readable browser info
  const getReadableUA = (ua) => {
    if (!ua) return 'Unknown Client'
    if (ua.includes('Firefox')) return 'Mozilla Firefox'
    if (ua.includes('Chrome')) return 'Google Chrome'
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari'
    if (ua.includes('Edge')) return 'Microsoft Edge'
    return ua.length > 30 ? `${ua.slice(0, 30)}...` : ua
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Access Management</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Security & Sessions Console</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium">
              Monitor active logins in real time, audit system activities, and revoke access keys immediately.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-3 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Sync Console
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            {error}
          </div>
        )}

        {actionError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            {actionError}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-750 font-medium flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
            {success}
          </div>
        )}
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Active Sessions Panel */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Active User Sessions</h3>
              <p className="text-xs text-slate-500 font-medium">Currently authenticated login keys active in the LIS.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" /> Fetching active login keys...
              </div>
            ) : sessions.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">User / Role</th>
                    <th className="pb-3">IP Address</th>
                    <th className="pb-3">Device / Browser</th>
                    <th className="pb-3">Logged In</th>
                    <th className="pb-3 pr-2 text-right">Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.jti} className="hover:bg-slate-50/20 group">
                      <td className="py-3.5 pl-2">
                        <p className="font-extrabold text-slate-900">{session.userName}</p>
                        <p className="text-slate-400 text-[10px]">{session.userEmail} • <span className="font-bold text-blue-600 dark:text-blue-400">{session.userRole}</span></p>
                      </td>
                      <td className="py-3.5 font-medium text-slate-650">{session.ipAddress || '127.0.0.1'}</td>
                      <td className="py-3.5 text-slate-500 font-medium" title={session.userAgent}>
                        {getReadableUA(session.userAgent)}
                      </td>
                      <td className="py-3.5 text-slate-450 font-medium">
                        {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleRevoke(session.jti)}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xxs font-extrabold px-3 py-2 border border-rose-150 transition cursor-pointer"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Log Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-12 text-center text-slate-500">No active sessions located.</p>
            )}
          </div>
        </section>

        {/* Audit Log Panel */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Security Audit Trail</h3>
              <p className="text-xs text-slate-500 font-medium">Audit logs of all database updates, creations, and security operations.</p>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px] border border-slate-200 rounded-2xl bg-white/50 text-xs">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" /> Synchronizing logs...
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="divide-y divide-slate-150">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50/50 transition">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-extrabold text-slate-800">{log.action}</span>
                      <span className="inline-block bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[9px] border border-blue-100 shrink-0">
                        {log.userRole}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1 font-semibold leading-relaxed">{log.description}</p>
                    
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2">
                      <span>Operator: {log.userName}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-8 text-center text-slate-500">No actions tracked in system logs.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
