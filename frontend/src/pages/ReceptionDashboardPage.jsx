import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  LoaderCircle,
  PlusCircle,
  Search,
  UserPlus,
  CreditCard,
  Barcode,
  Receipt,
  Printer,
  X,
} from 'lucide-react'
import { api } from '../lib/api.js'

export function ReceptionDashboardPage() {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Search & Filter State
  const [apptSearch, setApptSearch] = useState('')
  const [patientSearch, setPatientSearch] = useState('')

  // Active Invoice Detail State
  const [activeInvoice, setActiveInvoice] = useState(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  // Forms State
  const [showRegForm, setShowRegForm] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)

  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: 'Patient@12345' })
  const [bookForm, setBookForm] = useState({ patientId: '', date: '', reason: '', testIds: [] })

  // State for active specimen QR/Barcode label preview
  const [activeLabelAppt, setActiveLabelAppt] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [apptRes, usersRes, testsRes] = await Promise.all([
        api.get('/appointments/all'),
        api.get('/users'),
        api.get('/tests')
      ])
      setAppointments(apptRes.data)
      setPatients(usersRes.data.users.filter(u => u.role === 'PATIENT'))
      setTests(testsRes.data.tests || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to retrieve receptionist dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Filters
  const filteredAppointments = useMemo(() => {
    const query = apptSearch.trim().toLowerCase()
    if (!query) return appointments
    return appointments.filter(a =>
      a.patient_name.toLowerCase().includes(query) ||
      (a.barcode && a.barcode.toLowerCase().includes(query))
    )
  }, [apptSearch, appointments])

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase()
    if (!query) return patients
    return patients.filter(p =>
      p.firstName.toLowerCase().includes(query) ||
      p.lastName.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
    )
  }, [patientSearch, patients])

  const handleRegisterPatient = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.post('/users', { ...regForm, role: 'PATIENT' })
      setMessage(`Patient registered successfully! Email: ${regForm.email}, Temp Pass: ${regForm.password}`)
      setRegForm({ firstName: '', lastName: '', email: '', phone: '', password: 'Patient@12345' })
      setShowRegForm(false)
      await loadData()
    } catch (err) {
      const serverMessage = err?.response?.data?.message
      const serverErrors = err?.response?.data?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        const errorDetails = Object.entries(serverErrors)
          .map(([field, msg]) => msg)
          .join(' ')
        setError(`${serverMessage ? `${serverMessage}: ` : ''}${errorDetails}`)
      } else {
        setError(serverMessage || 'Patient registration failed.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBookWalkIn = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    if (!bookForm.patientId || !bookForm.date || !bookForm.reason || bookForm.testIds.length === 0) {
      setError('Please fill in all booking fields and select at least one test package.')
      setSaving(false)
      return
    }

    try {
      await api.post('/appointments/staff', {
        patientId: bookForm.patientId,
        appointment_date: bookForm.date,
        reason: bookForm.reason,
        testIds: bookForm.testIds
      })
      setMessage('Walk-in appointment and invoice created successfully.')
      setBookForm({ patientId: '', date: '', reason: '', testIds: [] })
      setShowBookForm(false)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Walk-in booking failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckIn = async (apptId) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await api.post(`/appointments/${apptId}/check-in`)
      setMessage(`Checked in successfully! Sample Barcode generated: ${res.data.barcode}`)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Check-in failed.')
    } finally {
      setSaving(false)
    }
  }

  const fetchInvoiceDetails = async (appt) => {
    setError('')
    try {
      const res = await api.get(`/invoices/appointment/${appt.id}`)
      setActiveInvoice({
        ...res.data.invoice,
        tests: appt.tests,
        patient_name: appt.patient_name
      })
      setAmountPaid(parseFloat(res.data.invoice.net_amount).toFixed(2))
    } catch (err) {
      setError('Could not retrieve invoice details.')
    }
  }

  const handlePaymentCheckout = async (e) => {
    e.preventDefault()
    if (!activeInvoice) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.post(`/invoices/${activeInvoice.id}/payments`, {
        amount_paid: amountPaid,
        payment_method: paymentMethod
      })
      setMessage(`Checkout complete! LKR ${amountPaid} logged successfully.`)
      setActiveInvoice(null)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment checkout failed.')
    } finally {
      setSaving(false)
    }
  }

  const toggleTestInBooking = (id) => {
    setBookForm((c) => ({
      ...c,
      testIds: c.testIds.includes(id)
        ? c.testIds.filter(tid => tid !== id)
        : [...c.testIds, id]
    }))
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
      {/* Overview stats */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between font-semibold">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Reception Console</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Intake & Billing Register</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium">
              Onboard new patients, check in scheduled appointments, collect diagnostic sample barcodes, and log client payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setShowRegForm(true)
                setShowBookForm(false)
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-xs font-bold transition shadow"
            >
              <UserPlus className="h-4 w-4" />
              Onboard Patient
            </button>
            <button
              onClick={() => {
                setShowBookForm(true)
                setShowRegForm(false)
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 text-xs font-bold transition shadow"
            >
              <PlusCircle className="h-4 w-4" />
              Book Walk-In
            </button>
          </div>
        </div>

        {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div> : null}
      </section>

      {/* Main grids */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Left Grid: Worklist Tracker */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Patient Worklist & Queue</h3>
                <p className="text-xs text-slate-500 font-medium">Monitor schedule queues, collect samples, and trigger check-ins.</p>
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 transition">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input value={apptSearch} onChange={(e) => setApptSearch(e.target.value)} placeholder="Filter by patient name..." className="border-0 bg-transparent text-xs outline-none" />
            </label>
          </div>

          <div className="mt-4 flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" /> Loading patient queue...
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => {
                  const isScheduled = appt.status === 'SCHEDULED'
                  const isCompleted = appt.status === 'COMPLETED'
                  const isCancelled = appt.status === 'CANCELLED'
                  const isPaid = appt.payment_status === 'PAID'
                  const hasSample = appt.sample_status && appt.sample_status !== 'PENDING'

                  return (
                    <div key={appt.id} className="py-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between group hover:bg-slate-50/20 px-2 rounded-2xl transition">
                      <div className="space-y-1.5 font-semibold">
                        <p className="font-extrabold text-slate-900 text-sm">{appt.patient_name}</p>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-450">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDateTime(appt.appointment_date)}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1">
                          {appt.tests?.map((t) => (
                            <span key={t.id} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50">
                              {t.code}
                            </span>
                          ))}
                        </div>

                        {/* Barcode & Sample Badge */}
                        {appt.barcode && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl w-max">
                            <Barcode className="h-3.5 w-3.5 text-blue-600" />
                            <span>{appt.barcode}</span>
                            <span className="text-[9px] font-extrabold text-blue-800 uppercase">({appt.sample_status})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2.5 shrink-0 justify-center">
                        <div className="flex items-center gap-2">
                          {/* Payment status badge */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            {appt.payment_status || 'UNBILLED'}
                          </span>

                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-lg border ${isScheduled ? 'bg-blue-50 text-blue-600 border-blue-100' : isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                            {appt.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          {isScheduled && !hasSample && (
                            <button
                              onClick={() => handleCheckIn(appt.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 transition"
                            >
                              <Barcode className="h-3.5 w-3.5" />
                              Check In
                            </button>
                          )}

                          {appt.barcode && (
                            <button
                              onClick={() => setActiveLabelAppt(appt)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 transition shadow-sm"
                            >
                              <Printer className="h-3.5 w-3.5 text-blue-600" />
                              Print Label
                            </button>
                          )}

                          {appt.invoice_id && (
                            <button
                              onClick={() => fetchInvoiceDetails(appt)}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 transition shadow-sm"
                            >
                              <Receipt className="h-3.5 w-3.5 text-slate-400" />
                              Checkout Bill
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">No scheduled patient queues on this workstation.</div>
            )}
          </div>
        </section>

        {/* Right Grid: Checkout Bill Form */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          {activeInvoice ? (
            <form onSubmit={handlePaymentCheckout} className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Receipt className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Payment Collection</h3>
                    <p className="text-xs text-slate-500 font-medium">Log client payments and issue receipts.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveInvoice(null)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Bill Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 text-xs space-y-2.5 text-slate-500 font-semibold">
                <p>Client Name: <span className="font-bold text-slate-900">{activeInvoice.patient_name}</span></p>
                <p>Invoice ID: <span className="font-bold text-slate-700 uppercase">{activeInvoice.id.slice(0, 8)}</span></p>
                <p>Billing Status:
                  <span className={`ml-1.5 font-extrabold ${activeInvoice.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeInvoice.payment_status}
                  </span>
                </p>

                <div className="border-t border-slate-200 pt-2.5">
                  <p className="font-bold text-slate-800 mb-1">Ordered Panels:</p>
                  <ul className="space-y-1 pl-3 list-disc">
                    {activeInvoice.tests?.map((t) => (
                      <li key={t.id || t.code} className="flex justify-between">
                        <span>{t.name}</span>
                        <span className="font-bold text-slate-850">LKR {parseFloat(t.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Net Amount due:</span>
                  <span>LKR {parseFloat(activeInvoice.net_amount).toFixed(2)}</span>
                </div>
              </div>

              {activeInvoice.payment_status !== 'PAID' ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 font-semibold">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collect Amount (LKR)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-950 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </label>

                  <label className="block space-y-1.5 font-semibold">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Channel</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-955 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      <option value="CASH">Cash Transaction</option>
                      <option value="CARD">Card POS Terminal</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 text-sm shadow transition"
                  >
                    <CreditCard className="h-4 w-4" />
                    Process Payment Checkout
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Bill fully settled. No actions required.
                </div>
              )}
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl min-h-[300px]">
              <Receipt className="h-10 w-10 text-slate-350" />
              <h4 className="font-bold text-slate-800 mt-3">No Invoice Active</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs">Select "Checkout Bill" next to any patient queue item to review invoice breakdown and log payments.</p>
            </div>
          )}
        </section>
      </div>

      {/* Patient Register Modal Overlay */}
      {showRegForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-205 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Register New Patient
              </h3>
              <button onClick={() => setShowRegForm(false)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="First Name" value={regForm.firstName} onChange={(value) => setRegForm(c => ({ ...c, firstName: value }))} placeholder="e.g. John" />
                <TextField label="Last Name" value={regForm.lastName} onChange={(value) => setRegForm(c => ({ ...c, lastName: value }))} placeholder="e.g. Doe" />
              </div>
              <TextField label="Email Address" type="email" value={regForm.email} onChange={(value) => setRegForm(c => ({ ...c, email: value }))} placeholder="patient@gmail.com" />
              <TextField label="Phone Number" value={regForm.phone} onChange={(value) => setRegForm(c => ({ ...c, phone: value }))} placeholder="e.g. 0771234567" />
              <TextField label="Temporary Password" value={regForm.password} onChange={(value) => setRegForm(c => ({ ...c, password: value }))} />

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold py-3 text-sm rounded-2xl transition flex items-center justify-center gap-2 mt-4"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Onboard Patient
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Book walk in modal */}
      {showBookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-205 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-600" />
                Schedule Walk-In Appointment
              </h3>
              <button onClick={() => setShowBookForm(false)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookWalkIn} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <label className="block space-y-1.5 font-semibold">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Patient Profile</span>
                <select
                  value={bookForm.patientId}
                  onChange={(e) => setBookForm(c => ({ ...c, patientId: e.target.value }))}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-955 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="">-- Choose registered patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.email})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 font-semibold">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preferred Date & Time</span>
                <input
                  type="datetime-local"
                  value={bookForm.date}
                  onChange={(e) => setBookForm(c => ({ ...c, date: e.target.value }))}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-955 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>

              <label className="block space-y-1.5 font-semibold">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Symptoms / Diagnostics Note</span>
                <input
                  value={bookForm.reason}
                  onChange={(e) => setBookForm(c => ({ ...c, reason: e.target.value }))}
                  placeholder="e.g. Prescribed HbA1c glucose levels check"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-955 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>

              {/* Select tests */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Laboratory Test Directory</span>
                <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-2 max-h-[160px] overflow-y-auto">
                  {tests.map(test => (
                    <label key={test.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={bookForm.testIds.includes(test.id)}
                          onChange={() => toggleTestInBooking(test.id)}
                          className="rounded text-blue-600 h-4 w-4 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800">{test.name} ({test.code})</span>
                      </div>
                      <span className="font-bold text-slate-900">LKR {parseFloat(test.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {bookForm.testIds.length > 0 && (
                <div className="p-3 bg-blue-50 text-blue-800 font-bold border border-blue-100 rounded-2xl flex justify-between text-sm">
                  <span>Gross Cost total:</span>
                  <span>
                    LKR {parseFloat(tests.filter(t => bookForm.testIds.includes(t.id)).reduce((acc, t) => acc + parseFloat(t.price), 0)).toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm rounded-2xl transition flex items-center justify-center gap-2 mt-4"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Schedule Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Printable tube label modal */}
      {activeLabelAppt && (
        <div id="specimen-print-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:p-0 print:absolute print:left-0 print:top-0 print:w-full print:h-auto print:bg-transparent">
          {/* Dynamic print CSS inject to hide everything except the print token */}
          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              html, body, #root, #root > div, main {
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                position: static !important;
              }
              body * {
                visibility: hidden;
              }
              #specimen-print-modal, #specimen-print-modal * {
                visibility: visible !important;
              }
              #specimen-print-modal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                overflow: visible !important;
              }
              #printable-specimen-label {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 75mm !important;
                height: 40mm !important;
                border: none !important;
                padding: 10px !important;
                margin: 0 !important;
                box-shadow: none !important;
                background: white !important;
              }
            }
          `}} />

          <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 print:border-0 print:shadow-none print:p-0 print:w-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-blue-600" />
                Specimen Label Preview
              </h3>
              <button onClick={() => setActiveLabelAppt(null)} className="rounded-full p-1.5 hover:bg-slate-150 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Label Body Container */}
            <div className="mt-4 flex flex-col items-center justify-center border border-slate-200 rounded-2xl bg-slate-50/50 p-4 print:p-0 print:border-0 print:bg-transparent">
              <div
                id="printable-specimen-label"
                className="flex items-start justify-between font-mono text-[9px] text-slate-900 border border-slate-300 p-3 rounded-lg bg-white w-[75mm] h-[40mm] select-none box-border"
              >
                {/* Left side details */}
                <div className="flex flex-col justify-between h-full w-[60%] text-left uppercase">
                  <div className="space-y-0.5 leading-none">
                    <p className="font-extrabold text-blue-700 text-[10px] tracking-tight">LIS CLINICAL SPECIMEN</p>
                    <p className="text-[7px] text-slate-500 font-bold mb-1">{new Date(activeLabelAppt.appointment_date).toLocaleString()}</p>
                  </div>

                  <div className="space-y-1.5 leading-tight my-1">
                    <p className="font-extrabold truncate text-[10px]" style={{ maxWidth: '120px' }}>NAME: {activeLabelAppt.patient_name}</p>
                    <p className="font-extrabold">BARCODE: {activeLabelAppt.barcode}</p>
                    <p className="text-[8px] text-slate-600 leading-tight">
                      PANELS: <span className="font-bold">{activeLabelAppt.tests?.map(t => t.code).join(', ')}</span>
                    </p>
                  </div>

                  <div className="w-full">
                    <BarcodeSVG value={activeLabelAppt.barcode} />
                  </div>
                </div>

                {/* Right side QR code */}
                <div className="flex flex-col items-center justify-center w-[35%] h-full ml-1 border-l border-dashed border-slate-200 pl-2 leading-none uppercase">
                  <span className="text-[6px] font-bold text-slate-500 mb-1 text-center">Verify Specimen</span>
                  <img
                    alt="QR Verification"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`http://localhost:5173/verify/${activeLabelAppt.barcode}`)}`}
                    className="w-16 h-16 object-contain border border-slate-100 p-0.5 bg-white scale-90"
                  />
                  <span className="text-[6px] font-extrabold text-blue-600 mt-1.5 tracking-wider">{activeLabelAppt.barcode}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex gap-2 justify-end print:hidden">
              <button
                onClick={() => setActiveLabelAppt(null)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 transition shadow shadow-blue-600/10"
              >
                <Printer className="h-4 w-4" />
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BarcodeSVG({ value }) {
  const cleanValue = value ? value.replace(/[^A-Z0-9-]/g, '') : '';
  const charPatterns = {
    '0': 'n n n w w n w n n',
    '1': 'w n n w n n n n w',
    '2': 'n n w w n n n n w',
    '3': 'w n w w n n n n n',
    '4': 'n n n w w n n n w',
    '5': 'w n n w w n n n n',
    '6': 'n n w w w n n n n',
    '7': 'n n n w n n w n w',
    '8': 'w n n w n n w n n',
    '9': 'n n w w n n w n n',
    'A': 'w n n n n w n n w',
    'B': 'n n w n n w n n w',
    'C': 'w n w n n w n n n',
    'D': 'n n n n w w n n w',
    'E': 'w n n n w w n n n',
    'F': 'n n w n w w n n n',
    'G': 'n n n n n w w n w',
    'H': 'w n n n n w w n n',
    'I': 'n n w n n w w n n',
    'J': 'n n n n w w w n n',
    'K': 'w n n n n n n w w',
    'L': 'n n w n n n n w w',
    'M': 'w n w n n n n w n',
    'N': 'n n n n w n n w w',
    'O': 'w n n n w n n w n',
    'P': 'n n w n w n n w n',
    'Q': 'n n n n n n w w w',
    'R': 'w n n n n n w w n',
    'S': 'n n w n n n w w n',
    'T': 'n n n n w n w w n',
    'U': 'w w n n n n n n w',
    'V': 'n w w n n n n n w',
    'W': 'w w w n n n n n n',
    'X': 'n w n n w n n n w',
    'Y': 'w w n n w n n n n',
    'Z': 'n w w n w n n n n',
    '-': 'n w n n n n w n w',
    '*': 'n w n n w n w n n',
  };

  const patternStr = `*${cleanValue}*`;
  let combinedPattern = '';
  for (let i = 0; i < patternStr.length; i++) {
    const ch = patternStr[i].toUpperCase();
    const pat = charPatterns[ch] || charPatterns['-'];
    combinedPattern += pat.replace(/\s+/g, '') + 'n';
  }

  let x = 10;
  const rects = [];
  const barHeight = 22;

  for (let i = 0; i < combinedPattern.length; i++) {
    const isBar = i % 2 === 0;
    const isWide = combinedPattern[i] === 'w';
    const width = isWide ? 2.5 : 0.8;

    if (isBar) {
      rects.push(
        <rect
          key={i}
          x={x}
          y={2}
          width={width}
          height={barHeight}
          fill="black"
        />
      );
    }
    x += width;
  }

  return (
    <svg width={x + 10} height={barHeight + 4} className="mt-1 w-full max-h-[26px]">
      {rects}
    </svg>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block space-y-1 w-full font-semibold">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-950 placeholder:text-slate-350 transition duration-150"
      />
    </label>
  )
}
