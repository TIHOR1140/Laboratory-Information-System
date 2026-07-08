import { useEffect, useState } from 'react'
import {
  Calendar,
  PlusCircle,
  Clock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  X,
  LoaderCircle,
  FlaskConical,
  ShieldCheck,
  AlertCircle,
  Printer,
  FileText,
} from 'lucide-react'
import { api } from '../lib/api.js'

export function PatientPage() {
  const [appointments, setAppointments] = useState([])
  const [testsCatalog, setTestsCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmCancelId, setConfirmCancelId] = useState(null)

  // Report Modal State
  const [activeReportAppt, setActiveReportAppt] = useState(null)
  const [reportResults, setReportResults] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)

  // Form State
  const [appointmentDate, setAppointmentDate] = useState('')
  const [reason, setReason] = useState('')
  const [selectedTests, setSelectedTests] = useState([])
  const [formError, setFormError] = useState('')

  const loadPageData = async () => {
    setLoading(true)
    setError('')
    try {
      const [apptRes, testsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/tests')
      ])
      setAppointments(apptRes.data)
      setTestsCatalog(testsRes.data.tests || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load dashboard information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [])

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    setSuccess('')

    if (!appointmentDate || !reason.trim()) {
      setFormError('Please select a valid date/time and state the reason.')
      setSaving(false)
      return
    }

    if (selectedTests.length === 0) {
      setFormError('Please select at least one laboratory test package.')
      setSaving(false)
      return
    }

    if (new Date(appointmentDate) < new Date()) {
      setFormError('Appointment date cannot be in the past.')
      setSaving(false)
      return
    }

    try {
      await api.post('/appointments', {
        appointment_date: appointmentDate,
        reason: reason,
        testIds: selectedTests,
      })

      // Reset form
      setAppointmentDate('')
      setReason('')
      setSelectedTests([])
      setIsModalOpen(false)
      setSuccess('Appointment and invoice created successfully.')
      await loadPageData()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to book appointment.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAppointment = async (id) => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/appointments/${id}/cancel`)
      setSuccess('Appointment successfully cancelled.')
      setConfirmCancelId(null)
      await loadPageData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to cancel appointment.')
    } finally {
      setSaving(false)
    }
  }

  const fetchReportResults = async (appt) => {
    setLoadingReport(true)
    setActiveReportAppt(appt)
    try {
      const res = await api.get(`/results/appointment/${appt.id}`)
      setReportResults(res.data)
    } catch (err) {
      setError('Unable to fetch report results.')
    } finally {
      setLoadingReport(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const toggleTestSelection = (testId) => {
    setSelectedTests((current) =>
      current.includes(testId)
        ? current.filter((id) => id !== testId)
        : [...current, testId]
    )
  }

  const formatDateTime = (dateTimeStr) => {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return new Date(dateTimeStr).toLocaleDateString('en-US', options)
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Overview section */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 print:hidden">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Patient Portal</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Your Health Dashboard</h2>
        <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-500 font-medium">
          Welcome to your personal health dashboard. Here you can schedule and manage appointments, view test results, and download laboratory report prints.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={FlaskConical}
            label="Tests Ordered"
            value={`${appointments.reduce((acc, a) => acc + (a.tests?.length || 0), 0)} Total`}
            description="Diagnostic test profiles requested during your registration."
          />
          <InfoCard
            icon={Calendar}
            label="Appointments"
            value={`${appointments.filter(a => a.status === 'SCHEDULED').length} Scheduled`}
            description="View date, status, or book new testing sessions."
          />
          <InfoCard
            icon={ShieldCheck}
            label="Completed Results"
            value={`${appointments.filter(a => a.status === 'COMPLETED').length} Signed-Off`}
            description="Reports certified by our laboratory technicians."
          />
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3 print:hidden">
        {/* Left 2 Cols: Appointments */}
        <section className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">My Appointments</h3>
                <p className="text-xs text-slate-500 font-medium">Review your testing calendar and schedule.</p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-750 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Book Appointment
            </button>
          </div>

          {success ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
                <span className="font-semibold text-sm">Loading your appointments...</span>
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appt) => {
                  const isScheduled = appt.status === 'SCHEDULED'
                  const isCompleted = appt.status === 'COMPLETED'

                  return (
                    <div
                      key={appt.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/20 p-5 transition hover:shadow hover:bg-white"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>{formatDateTime(appt.appointment_date)}</span>
                          </div>

                          <div className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                            <ClipboardList className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-700">Reason for visit:</p>
                              <p className="mt-0.5">{appt.reason}</p>
                            </div>
                          </div>

                          {appt.tests && appt.tests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {appt.tests.map((t) => (
                                <span key={t.id || t.code} className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5 border border-slate-200/50">
                                  {t.name} ({t.code})
                                </span>
                              ))}
                            </div>
                          )}

                          {appt.net_amount && (
                            <div className="text-xs text-slate-500 font-semibold">
                              Billing: <span className="font-extrabold text-slate-800">LKR {parseFloat(appt.net_amount).toFixed(2)}</span>
                              <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold ${appt.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                {appt.payment_status}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          {/* Status Badge */}
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold border ${isScheduled
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {appt.status}
                          </span>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => fetchReportResults(appt)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-100 hover:bg-blue-100/55 transition"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Lab Report
                            </button>
                          )}

                          {/* Cancellation Button Logic */}
                          {isScheduled && (
                            <div className="w-full">
                              {confirmCancelId === appt.id ? (
                                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-2 rounded-2xl">
                                  <span className="text-xs font-bold text-rose-700">Cancel?</span>
                                  <button
                                    onClick={() => handleCancelAppointment(appt.id)}
                                    disabled={saving}
                                    className="rounded-xl bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmCancelId(null)}
                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(appt.id)}
                                  className="w-full text-right text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                                >
                                  Cancel Appointment
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-350 p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-slate-350" />
                <h4 className="mt-4 text-lg font-bold text-slate-900">No appointments found</h4>
                <p className="mt-2 text-sm text-slate-500 font-medium font-medium">You don't have any appointments scheduled yet.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  <PlusCircle className="h-4 w-4" /> Book your first slot
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Col: Laboratory Testing Instructions */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FlaskConical className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Testing Guidelines</h3>
              <p className="text-xs text-slate-500 font-medium font-medium">Pre-appointment instructions.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-xs text-slate-500 leading-relaxed font-medium">
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
              <p className="font-bold text-blue-800 text-sm">🩸 Fasting Requirements</p>
              <p className="mt-1">For Lipid Profiles and Blood Sugar tests, ensure you fast for 8-12 hours prior to your scheduled time. You can drink plain water.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-800 text-sm">📄 Documentation</p>
              <p className="mt-1">Please bring your doctor's test referral prescription and a valid national ID card with you to the reception counter.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-800 text-sm">⏰ Arrival Time</p>
              <p className="mt-1">Arrive at least 10-15 minutes prior to your appointment to complete the check-in process at the receptionist desk.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Book Appointment Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900">Schedule Appointment</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedTests([])
                  setFormError('')
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preferred Date & Time</span>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reason for Test / Symptoms</span>
                <textarea
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="E.g. FBS sugar test, standard general blood count..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-955 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>

              {/* Select Tests Checklist */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Select Ordered Tests Catalog</span>
                <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-2 max-h-[180px] overflow-y-auto">
                  {testsCatalog.length > 0 ? (
                    testsCatalog.map((test) => (
                      <label key={test.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTests.includes(test.id)}
                            onChange={() => toggleTestSelection(test.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-800">{test.name}</span>
                          <span className="text-[9px] uppercase bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 border">
                            {test.code}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900">LKR {parseFloat(test.price).toFixed(2)}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">No tests configured in settings.</p>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              {selectedTests.length > 0 && (
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex justify-between items-center text-sm font-bold text-blue-800">
                  <span>Invoicing Total Amount:</span>
                  <span className="text-lg font-extrabold text-blue-900">
                    LKR {parseFloat(testsCatalog.filter(t => selectedTests.includes(t.id)).reduce((acc, t) => acc + parseFloat(t.price), 0)).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setSelectedTests([])
                    setFormError('')
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-750 transition disabled:opacity-70"
                >
                  {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Schedule Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal Viewer */}
      {activeReportAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl flex flex-col max-h-[95vh] print:p-0 print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:static">

            {/* Header Actions (hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Laboratory Diagnostics Report
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => {
                    setActiveReportAppt(null)
                    setReportResults([])
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Section */}
            <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0 print:block">
              {loadingReport ? (
                <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                  <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" /> Loading results sheet...
                </div>
              ) : (
                <div className="space-y-6 print:space-y-8 font-sans">
                  {/* Clinic Logo/Branding Header */}
                  <div className="text-center pb-4 border-b-2 border-slate-900">
                    <h2 className="text-2xl font-extrabold uppercase tracking-widest text-slate-900">Laboratory Information System (LIS)</h2>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Medical Diagnostics Clinic & Laboratory Services</p>
                    <p className="text-xxs text-slate-400 mt-0.5">Colombo, Sri Lanka • Tel: +94 11 234 5678</p>
                  </div>

                  {/* Patient/Metadata Panel */}
                  <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 print:border-slate-300 print:bg-transparent">
                    <div className="space-y-1.5 text-xs text-slate-655 font-semibold">
                      <p>Patient Name: <span className="font-extrabold text-slate-900">{activeReportAppt.patient_name || 'Patient'}</span></p>
                      <p>Appointment: <span className="font-bold text-slate-800">{formatDateTime(activeReportAppt.appointment_date)}</span></p>
                      <p>Barcode Sample: <span className="font-bold text-slate-800">{activeReportAppt.barcode || 'N/A'}</span></p>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-655 text-right font-semibold">
                      <p>Report Code: <span className="font-bold text-slate-800 uppercase">{activeReportAppt.id.slice(0, 8)}</span></p>
                      <p>Status: <span className="font-extrabold text-emerald-600 uppercase">Certified</span></p>
                      <p>Completion Date: <span className="font-bold text-slate-800">{formatDateTime(activeReportAppt.updated_at)}</span></p>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-3">Diagnostic Panels</h4>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-2.5">Test Parameter</th>
                          <th className="py-2.5">Observed Value</th>
                          <th className="py-2.5">Reference Range</th>
                          <th className="py-2.5 text-right">Measurement Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportResults.map((res) => (
                          <tr key={res.id} className="text-slate-700">
                            <td className="py-3">
                              <p className="font-bold text-slate-800">{res.test_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{res.test_code}</p>
                            </td>
                            <td className="py-3 font-bold">
                              <span className={res.is_normal ? 'text-slate-900' : 'text-rose-600 font-extrabold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg'}>
                                {res.result_value}
                              </span>
                              {!res.is_normal && (
                                <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-rose-500 select-none">Abnormal</span>
                              )}
                            </td>
                            <td className="py-3 text-slate-500 font-semibold">{res.reference_range}</td>
                            <td className="py-3 text-slate-500 font-semibold text-right">{res.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Doctor/Staff Signature Area */}
                  <div className="pt-12 mt-12 grid grid-cols-2 gap-8 text-xs text-slate-500 print:pt-16">
                    <div className="text-left font-semibold">
                      <p>Laboratory Technologist Signature</p>
                      <div className="h-[1px] w-48 bg-slate-300 mt-12 mb-1" />
                      <p className="font-bold text-slate-700">LIS Certified Officer</p>
                      <p className="text-xxs font-medium text-slate-400">Automated sign-off via system authorization</p>
                    </div>
                    <div className="text-right flex flex-row items-center justify-end gap-4 font-semibold">
                      <div>
                        <p className="italic">Report Generated Electronically</p>
                        <p className="text-[9px] font-medium text-slate-400 mt-1 max-w-[200px] leading-tight">This is an authentic system generated medical report. Scan the QR code to verify details.</p>
                      </div>
                      {activeReportAppt.barcode && (
                        <div className="bg-white p-1 border border-slate-200 rounded-lg flex flex-col items-center shadow-xs">
                          <img
                            alt="Verification QR"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`http://localhost:5173/verify/${activeReportAppt.barcode}`)}`}
                            className="w-14 h-14 object-contain"
                          />
                          <span className="text-[7.5px] font-extrabold text-blue-600 uppercase tracking-widest mt-1 block leading-none">{activeReportAppt.barcode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS to support printing of reports */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden, header, aside, button, nav {
            display: none !important;
          }
          div.fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          div.fixed > div {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          div.fixed * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 leading-none">{value}</p>
      </div>
      <p className="mt-3 text-xs text-slate-500 leading-normal font-medium">{description}</p>
    </div>
  )
}
