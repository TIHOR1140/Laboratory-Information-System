import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  LoaderCircle,
  Search,
  Barcode,
  FlaskConical,
  Beaker,
  X,
  FileCheck,
} from 'lucide-react'
import { api } from '../lib/api.js'

export function TechnicianDashboardPage() {
  const [samples, setSamples] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const playSynthBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.type = 'sine'
      osc.frequency.value = 1100
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.12)
    } catch (e) {
      console.log(e)
    }
  }

  const handleSimulatedScan = (sample) => {
    playSynthBeep()
    setSearch(sample.barcode || '')
    setShowScanner(false)
    startResultEntry(sample)
  }

  // Active Result Entry Session
  const [activeSession, setActiveSession] = useState(null) // holds appointment metadata
  const [resultsForm, setResultsForm] = useState({}) // testId: { value: '', isNormal: true }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [samplesRes, apptRes] = await Promise.all([
        api.get('/samples'),
        api.get('/appointments/all')
      ])
      setSamples(samplesRes.data.samples)
      setAppointments(apptRes.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load technician console data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Filters
  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return samples
    return samples.filter(s =>
      s.patient_name.toLowerCase().includes(query) ||
      (s.barcode && s.barcode.toLowerCase().includes(query))
    )
  }, [search, samples])

  const handleUpdateStatus = async (sampleId, newStatus) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.patch(`/samples/${sampleId}`, { status: newStatus })
      setMessage(`Sample marked as ${newStatus.toLowerCase()} successfully!`)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Sample status update failed.')
    } finally {
      setSaving(false)
    }
  }

  const startResultEntry = (sample) => {
    const matchedAppt = appointments.find(a => a.id === sample.appointment_id)
    if (!matchedAppt) {
      setError('Appointment metadata not found.')
      return
    }

    // Initialize resultsForm with empty values
    const initialForm = {}
    matchedAppt.tests?.forEach(t => {
      initialForm[t.id] = { value: '', isNormal: true }
    })

    setActiveSession({
      sample,
      appointment: matchedAppt
    })
    setResultsForm(initialForm)
  }

  const handleResultSubmit = async (e) => {
    e.preventDefault()
    if (!activeSession) return
    setSaving(true)
    setError('')
    setMessage('')

    const submissionResults = Object.entries(resultsForm).map(([testId, r]) => ({
      testId,
      resultValue: r.value,
      isNormal: r.isNormal
    }))

    // Validate that all fields have values
    const isAnyEmpty = submissionResults.some(r => !r.resultValue.trim())
    if (isAnyEmpty) {
      setError('Please fill in observation values for all tests before signing off.')
      setSaving(false)
      return
    }

    try {
      await api.post('/results', {
        appointmentId: activeSession.appointment.id,
        results: submissionResults
      })
      setMessage('Test results verified and signed off successfully! Patient notified.')
      setActiveSession(null)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit test results.')
    } finally {
      setSaving(false)
    }
  }

  const handleFormValueChange = (testId, val) => {
    setResultsForm(c => ({
      ...c,
      [testId]: { ...c[testId], value: val }
    }))
  }

  const handleFormNormalChange = (testId, normalVal) => {
    setResultsForm(c => ({
      ...c,
      [testId]: { ...c[testId], isNormal: normalVal }
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
      {/* Overview Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between font-semibold">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Lab Technician Console</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Specimen Processing Worklist</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium">
              Track specimen processing workflows, run analysis stages, and transcribe diagnostics observed values from analyzer sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 transition animate-in fade-in">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search barcode or patient" className="border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-350 font-medium" />
            </label>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold px-4 py-3 text-xs transition shadow-sm"
              title="Camera Scan Specimen"
            >
              <Barcode className="h-4 w-4 text-blue-600" />
              Scan Specimen
            </button>
          </div>
        </div>

        {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div> : null}
      </section>

      {/* Main Grids */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Left Col: Worklist */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <FlaskConical className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Specimen Processing Queue</h3>
              <p className="text-xs text-slate-500 font-medium">List of collected blood/urine samples ready for analysis entry.</p>
            </div>
          </div>

          <div className="mt-4 flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" /> Fetching active worklist...
              </div>
            ) : filteredSamples.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredSamples.map((sample) => {
                  const isPending = sample.status === 'PENDING'
                  const isCollected = sample.status === 'COLLECTED'
                  const isProcessing = sample.status === 'PROCESSING'

                  return (
                    <div key={sample.id} className="py-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between group hover:bg-slate-50/20 px-2 rounded-2xl transition">
                      <div className="space-y-1.5 font-semibold">
                        <p className="font-extrabold text-slate-900 text-sm">{sample.patient_name}</p>

                        <div className="flex items-center gap-1 text-[10px] text-slate-450">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Booked: {formatDateTime(sample.appointment_date)}</span>
                        </div>

                        {sample.barcode && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-655 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg w-max mt-1">
                            <Barcode className="h-3.5 w-3.5 text-blue-650" />
                            <span>{sample.barcode}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2.5 shrink-0 justify-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${isPending ? 'bg-amber-50 text-amber-600 border-amber-100' : isCollected ? 'bg-blue-50 text-blue-650 border-blue-100' : isProcessing ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-650 border-emerald-100'
                          }`}>
                          {sample.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isCollected && (
                            <button
                              onClick={() => handleUpdateStatus(sample.id, 'PROCESSING')}
                              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 transition"
                            >
                              Process
                            </button>
                          )}
                          {(isCollected || isProcessing) && (
                            <button
                              onClick={() => startResultEntry(sample)}
                              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 transition shadow"
                            >
                              Enter Results
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">No diagnostic samples in queue. Wait for receptionist check-ins.</div>
            )}
          </div>
        </section>

        {/* Right Col: Result Entry Form */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          {activeSession ? (
            <form onSubmit={handleResultSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Beaker className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Observation Register</h3>
                    <p className="text-xs text-slate-500 font-medium">Transcribe diagnostic values.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveSession(null)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Patient Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 text-xs space-y-1.5 text-slate-500 font-semibold">
                <p>Patient Name: <span className="font-bold text-slate-900">{activeSession.appointment.patient_name}</span></p>
                <p>Sample Barcode: <span className="font-bold text-slate-900">{activeSession.sample.barcode}</span></p>
                <p>Diagnostics Reason: <span className="font-bold text-slate-800">{activeSession.appointment.reason}</span></p>
              </div>

              {/* Observation Fields */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">Observation Sheets</p>

                {activeSession.appointment.tests?.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm hover:border-slate-300 transition">
                    <div className="flex justify-between items-start font-semibold">
                      <div>
                        <span className="inline-block bg-slate-100 border text-slate-655 text-[9px] font-bold rounded px-1.5 py-0.5 uppercase mb-1">
                          {t.code}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{t.name}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400">
                        <p>Unit: <span className="font-bold text-slate-600">{t.unit}</span></p>
                        <p>Normal: <span className="font-bold text-slate-600">{t.reference_range}</span></p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 items-center">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          value={resultsForm[t.id]?.value || ''}
                          onChange={(e) => handleFormValueChange(t.id, e.target.value)}
                          placeholder={`Enter observed value (${t.unit})`}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 text-xs outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none font-bold">
                        <input
                          type="checkbox"
                          checked={!resultsForm[t.id]?.isNormal}
                          onChange={(e) => handleFormNormalChange(t.id, !e.target.checked)}
                          className="rounded text-rose-500 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                        />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Abnormal</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold py-3.5 text-sm rounded-2xl shadow transition flex items-center justify-center gap-2 mt-4"
              >
                <FileCheck className="h-4 w-4" />
                Verify & Sign Off Results
              </button>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl min-h-[300px]">
              <Beaker className="h-10 w-10 text-slate-350" />
              <h4 className="font-bold text-slate-800 mt-3">Observation sheet empty</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs">Select "Enter Results" next to any active specimen queue item to log observation fields.</p>
            </div>
          )}
        </section>
      </div>

      {/* Specimen Barcode Camera Scanner Simulator Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Barcode className="h-4 w-4 text-blue-600" />
                Specimen Scanner Simulator
              </h3>
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="rounded-full p-1.5 hover:bg-slate-150 text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Viewfinder Graphics */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 relative h-48 flex flex-col items-center justify-center text-center text-slate-350 p-4 select-none">
              {/* Animated scan indicator */}
              <div className="absolute left-0 right-0 h-0.5 bg-rose-500/80 shadow-md animate-bounce top-1/2" />
              <div className="absolute inset-x-12 inset-y-8 border-2 border-dashed border-blue-500/40 rounded-xl animate-pulse" />

              <span className="text-[9px] font-black tracking-[0.25em] text-blue-400 animate-pulse">WEBCAM LIVE SIMULATION</span>
              <p className="text-[10px] text-slate-500 font-bold max-w-xs mt-2.5 leading-relaxed">
                ALIGN TUBE BARCODE BOUNDARY TO TRIGGER AUTOMATED RESULT ENTRY
              </p>
            </div>

            {/* Mock select scanner options */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Specimens in queue (Select to simulate scan)</span>

              <div className="border border-slate-200 rounded-xl max-h-[140px] overflow-y-auto divide-y divide-slate-100 bg-white">
                {samples.filter(s => s.status === 'COLLECTED' || s.status === 'PROCESSING').length > 0 ? (
                  samples.filter(s => s.status === 'COLLECTED' || s.status === 'PROCESSING').map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSimulatedScan(s)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 flex items-center justify-between font-semibold text-slate-800 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Barcode className="h-3.5 w-3.5 text-blue-650" />
                        <span className="font-extrabold text-slate-900">{s.barcode}</span>
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 truncate max-w-[125px]">{s.patient_name}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 p-4 text-center font-bold">No specimen tubes collected/processing in the active queue.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs rounded-xl transition shadow"
              >
                Close Scanner Interface
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
