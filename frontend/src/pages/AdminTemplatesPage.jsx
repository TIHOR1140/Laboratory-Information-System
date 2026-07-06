import { FileText, ImagePlus, LoaderCircle, PlusCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminBanner, AdminSpinner, AdminTextField } from '../components/admin/AdminUi.jsx'
import { api } from '../lib/api.js'

// Report template management for consistent lab report branding.
const emptyForm = {
  name: '',
  header: '',
  footer: '',
  logoUrl: '',
  notes: '',
}

export function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/templates')
      setTemplates(response.data.templates || [])
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load templates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: form.name.trim(),
        header: form.header.trim(),
        footer: form.footer.trim(),
        logoUrl: form.logoUrl.trim(),
        notes: form.notes.trim(),
      }

      if (editingId) {
        await api.put(`/admin/templates/${editingId}`, payload)
        setMessage('Template updated successfully.')
      } else {
        await api.post('/admin/templates', payload)
        setMessage('Template created successfully.')
      }

      resetForm()
      await loadTemplates()
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to save template.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (template) => {
    setEditingId(template.id)
    setForm({
      name: template.name || '',
      header: template.header || '',
      footer: template.footer || '',
      logoUrl: template.logoUrl || '',
      notes: template.notes || '',
    })
  }

  const templateCards = useMemo(() => templates, [templates])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Report templates</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Define report layouts that reflect your laboratory branding</h2>
          <p className="mt-3 max-w-3xl text-slate-600">Create reusable report templates with branding, headers, footers, and supporting instructions for the team.</p>
        </div>

        {message ? <AdminBanner tone="success" text={message} /> : null}
        {error ? <AdminBanner tone="error" text={error} /> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              {editingId ? <FileText className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit template' : 'Create template'}</h3>
              <p className="text-sm text-slate-600">Keep report formatting consistent across the department.</p>
            </div>
          </div>

          <AdminTextField label="Template Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Standard CBC Report" />
          <AdminTextField label="Header" value={form.header} onChange={(value) => setForm((current) => ({ ...current, header: value }))} placeholder="City Medical Laboratory" />
          <AdminTextField label="Footer" value={form.footer} onChange={(value) => setForm((current) => ({ ...current, footer: value }))} placeholder="Prepared by the lab team" />
          <AdminTextField label="Logo URL" value={form.logoUrl} onChange={(value) => setForm((current) => ({ ...current, logoUrl: value }))} placeholder="https://..." />
          <AdminTextField label="Notes" textarea value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} placeholder="Optional instructions or formatting details" />

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 disabled:opacity-70">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {editingId ? 'Update Template' : 'Create Template'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Clear</button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Available templates</h3>
              <p className="text-sm text-slate-600">Use these to standardize report presentation.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <AdminSpinner text="Loading templates" />
            ) : templateCards.length ? (
              templateCards.map((template) => (
                <div key={template.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{template.name}</p>
                      <p className="text-sm text-slate-600">{template.header || 'No header provided.'}</p>
                    </div>
                    <button type="button" onClick={() => startEdit(template)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Edit</button>
                  </div>
                  {template.footer ? <p className="mt-3 text-sm text-slate-600">Footer: {template.footer}</p> : null}
                  {template.notes ? <p className="mt-2 text-sm text-slate-500">Notes: {template.notes}</p> : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No templates available yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
