import { useEffect, useMemo, useState } from 'react'
import { ClipboardPlus, LoaderCircle, Trash2, Edit, Search } from 'lucide-react'
import { api } from '../lib/api.js'

export function AdminTestsPage() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  
  // Form State
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', category: 'Biochemistry', price: '', reference_range: '', unit: '' })

  const loadTests = async () => {
    setLoading(true)
    try {
      const response = await api.get('/tests')
      setTests(response.data.tests)
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load laboratory tests catalog.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTests()
  }, [])

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tests

    return tests.filter((test) => {
      const searchable = [test.name, test.code, test.category].join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [search, tests])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (editId) {
        await api.put(`/tests/${editId}`, form)
        setMessage('Test updated successfully.')
      } else {
        await api.post('/tests', form)
        setMessage('Test created successfully.')
      }
      setForm({ name: '', code: '', category: 'Biochemistry', price: '', reference_range: '', unit: '' })
      setEditId(null)
      await loadTests()
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to save test configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (test) => {
    setEditId(test.id)
    setForm({
      name: test.name,
      code: test.code,
      category: test.category,
      price: test.price,
      reference_range: test.reference_range,
      unit: test.unit
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test from the catalog?')) return
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.delete(`/tests/${id}`)
      setMessage('Test deleted successfully.')
      await loadTests()
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || 'Unable to delete test.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Lab Settings</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Diagnostics Test Directory</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium">
              Manage the directory of active diagnostic tests, default reference ranges, measurement units, and pricing indexes.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search test name or code" className="border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-350 font-medium" />
          </label>
        </div>

        {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Left Col: Setup/Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4 font-semibold">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                <ClipboardPlus className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{editId ? 'Modify Test Parameters' : 'Add Test Setup'}</h3>
                <p className="text-xs text-slate-500 font-medium">{editId ? 'Change reference parameters or pricing' : 'Create a new catalog diagnostic entry'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Test Name" value={form.name} onChange={(value) => setForm((c) => ({ ...c, name: value }))} placeholder="e.g. Fasting Blood Sugar" />
              <TextField label="Short Code" value={form.code} onChange={(value) => setForm((c) => ({ ...c, code: value }))} placeholder="e.g. FBS" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test Category</span>
                <select value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900">
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Clinical Pathology">Clinical Pathology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
              </label>
              
              <TextField label="Pricing (LKR)" type="number" value={form.price} onChange={(value) => setForm((c) => ({ ...c, price: value }))} placeholder="350.00" />
            </div>

            <TextField label="Reference Range Guidance" value={form.reference_range} onChange={(value) => setForm((c) => ({ ...c, reference_range: value }))} placeholder="e.g. 70 - 100" />
            <TextField label="Measurement Unit" value={form.unit} onChange={(value) => setForm((c) => ({ ...c, unit: value }))} placeholder="e.g. mg/dL" />
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
            {editId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditId(null)
                  setForm({ name: '', code: '', category: 'Biochemistry', price: '', reference_range: '', unit: '' })
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition">
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {editId ? 'Update Settings' : 'Add to Catalog'}
            </button>
          </div>
        </form>

        {/* Right Col: Catalog List Table */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Active Catalog Directory</h3>
          
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" /> Loading diagnostics catalog...
              </div>
            ) : filteredTests.length ? (
              <div className="divide-y divide-slate-100">
                {filteredTests.map((test) => (
                  <div key={test.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between group hover:bg-slate-50/50 transition">
                    <div className="font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100/50 uppercase">
                          {test.code}
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{test.name}</p>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">{test.category}</p>
                      <p className="mt-1 text-xs text-slate-500 font-medium">
                        Range: <span className="font-bold text-slate-700">{test.reference_range}</span> {test.unit}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:justify-end font-semibold">
                      <span className="text-sm font-extrabold text-slate-900">LKR {parseFloat(test.price).toFixed(2)}</span>
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button type="button" onClick={() => handleEdit(test)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-650 transition">
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(test.id)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition">
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">No tests registered in catalog. Add tests on the left.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block space-y-1.5 w-full font-semibold">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input 
        type={type} 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-350 transition duration-150" 
      />
    </label>
  )
}
