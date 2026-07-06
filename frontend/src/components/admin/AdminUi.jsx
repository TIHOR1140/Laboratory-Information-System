import { LoaderCircle } from 'lucide-react'

export function AdminTextField({ label, value, onChange, type = 'text', placeholder = '', textarea = false, rows = 3 }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      )}
    </label>
  )
}

export function AdminBanner({ tone, text }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  }

  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${styles[tone] || styles.info}`}>{text}</div>
}

export function AdminSpinner({ text = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-8 text-slate-500">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      {text}
    </div>
  )
}
