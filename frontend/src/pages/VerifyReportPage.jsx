import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, LoaderCircle, ShieldAlert, FileText } from 'lucide-react'
import { api } from '../lib/api.js'

export function VerifyReportPage() {
    const { barcode } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchVerification = async () => {
            setLoading(true)
            setError('')
            try {
                const res = await api.get(`/results/verify/${barcode}`)
                setData(res.data)
            } catch (err) {
                setError(err?.response?.data?.message || 'Verification failed. This barcode is invalid or record does not exist.')
            } finally {
                setLoading(false)
            }
        }
        if (barcode) {
            void fetchVerification()
        }
    }, [barcode])

    return (
        <div className="min-h-screen bg-[#f3f7fa] flex flex-col items-center justify-center px-4 py-12 selection:bg-blue-100 selection:text-blue-800">
            <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-[2.5rem] shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
                {/* Banner highlight */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />

                <div className="flex flex-col items-center justify-center">
                    {loading ? (
                        <div className="py-12 space-y-4">
                            <LoaderCircle className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying LIS Registry...</p>
                        </div>
                    ) : error ? (
                        <div className="py-8 space-y-4">
                            <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Report Verification Failed</h2>
                            <div className="rounded-2xl border border-rose-205 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 font-semibold max-w-md mx-auto my-3">
                                {error}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Verify the printed code matches the barcode label on your report.</p>
                            <div className="pt-6">
                                <Link to="/login" className="rounded-xl inline-flex bg-slate-905 px-5 py-3 text-xs font-bold text-white shadow hover:bg-slate-800 transition">
                                    Go to Sign In
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full text-left space-y-6 animate-in fade-in duration-200">
                            {/* Authenticated Header */}
                            <div className="text-center pb-4 border-b border-slate-100">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold mb-4 select-none">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    AUTHENTIC LIS CLINICAL RECORD
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Report Verified</h1>
                                <p className="text-xs text-slate-500 font-medium mt-1">This report matches the electronic records in our central database.</p>
                            </div>

                            {/* Patient Metas */}
                            <div className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-205 p-5 rounded-2xl">
                                <div className="space-y-1.5">
                                    <p>Patient Name: <span className="font-extrabold text-slate-905">{data.appointment.patient_name}</span></p>
                                    <p>Patient Email: <span className="font-extrabold text-slate-700">{data.appointment.patient_email}</span></p>
                                </div>
                                <div className="space-y-1.5">
                                    <p>Specimen Barcode: <span className="font-extrabold text-blue-700 tracking-wider font-mono">{data.appointment.barcode}</span></p>
                                    <p>Collection Date: <span className="font-extrabold text-slate-705">{new Date(data.appointment.appointment_date).toLocaleString()}</span></p>
                                </div>
                            </div>

                            {/* Lab Results Table */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Transcribed Test Results
                                </h3>

                                {data.results && data.results.length > 0 ? (
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                        <table className="w-full text-xs text-left text-slate-650">
                                            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3">Test Panel</th>
                                                    <th className="px-4 py-3">Report Value</th>
                                                    <th className="px-4 py-3">Reference Limits</th>
                                                    <th className="px-4 py-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-semibold">
                                                {data.results.map((r) => (
                                                    <tr key={r.id} className="hover:bg-slate-55/50 font-semibold">
                                                        <td className="px-4 py-3">
                                                            <span className="font-bold text-slate-900 block">{r.test_name}</span>
                                                            <span className="text-[10px] text-slate-400">{r.test_code}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px] font-black text-slate-900 border-l border-r border-slate-50">
                                                            {r.result_value} <span className="text-[10px] text-slate-500 font-medium">{r.unit}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-[11px] text-slate-500">{r.reference_range} {r.unit}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${r.is_normal
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                                }`}>
                                                                {r.is_normal ? 'NORMAL' : 'ABNORMAL'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-xs text-slate-500 border border-slate-200 border-dashed rounded-2xl">
                                        Laboratory analyses are currently in progress for this specimen.
                                    </div>
                                )}
                            </div>

                            {/* Back CTA */}
                            <div className="pt-4 flex justify-center">
                                <Link to="/login" className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow shadow-blue-500/10">
                                    Return to Portal Sign In
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
