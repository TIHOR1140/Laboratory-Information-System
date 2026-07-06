import { Edit3, FlaskConical, LoaderCircle, PlusCircle, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminBanner, AdminSpinner, AdminTextField } from '../components/admin/AdminUi.jsx'
import { api } from '../lib/api.js'

// Test catalogue management for creating and editing lab services.
const emptyForm = {
  testCode: '',
  name: '',
  category: 'Hematology',
  price: '',
  minRange: '',
  maxRange: '',
  unit: '',
  description: '',
  isActive: true,
}

export function AdminTestsPage() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const loadTests = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/tests')
      setTests(response.data.tests || [])
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load tests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTests()
  }, [])

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(tests.map((test) => test.category).filter(Boolean)))], [tests])

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tests.filter((test) => {
      const matchesCategory = category === 'ALL' || test.category === category
      const haystack = [test.name, test.testCode, test.category, test.description].join(' ').toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      return matchesCategory && matchesSearch
    })
  }, [category, search, tests])

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
        testCode: form.testCode.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        minRange: form.minRange === '' ? null : Number(form.minRange),
        maxRange: form.maxRange === '' ? null : Number(form.maxRange),
        unit: form.unit.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      }

      if (editingId) {
        await api.put(`/admin/tests/${editingId}`, payload)
        setMessage('Test updated successfully.')
      } else {
        await api.post('/admin/tests', payload)
        setMessage('Test created successfully.')
      }

      resetForm()
      await loadTests()
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to save test.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (test) => {
    setEditingId(test.id)
    setForm({
      testCode: test.testCode,
      name: test.name,
      category: test.category || 'Hematology',
      price: test.price,
      minRange: test.minRange ?? '',
      maxRange: test.maxRange ?? '',
      unit: test.unit || '',
      description: test.description || '',
      isActive: test.isActive,
    })
  }

  const deleteTest = async (testId) => {
    if (!window.confirm('Remove this test from the catalogue?')) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.delete(`/admin/tests/${testId}`)
      setMessage('Test removed successfully.')
      await loadTests()
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || 'Unable to remove test.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Test catalogue</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create, edit, and manage laboratory tests</h2>
            <p className="mt-3 max-w-3xl text-slate-600">Build a complete catalogue with pricing, reference ranges, and descriptive information for staff and reports.</p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tests" className="border-0 bg-transparent outline-none" />
          </label>
        </div>

        {message ? <AdminBanner tone="success" text={message} /> : null}
        {error ? <AdminBanner tone="error" text={error} /> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              {editingId ? <Edit3 className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit test' : 'Add test'}</h3>
              <p className="text-sm text-slate-600">Store the test definition used by the laboratory team.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminTextField label="Test Code" value={form.testCode} onChange={(value) => setForm((current) => ({ ...current, testCode: value }))} placeholder="e.g. CBC01" />
            <AdminTextField label="Test Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Complete Blood Count" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </label>
            <AdminTextField label="Unit" value={form.unit} onChange={(value) => setForm((current) => ({ ...current, unit: value }))} placeholder="mg/dL" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <AdminTextField label="Price" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} placeholder="0.00" />
            <AdminTextField label="Min Range" type="number" value={form.minRange} onChange={(value) => setForm((current) => ({ ...current, minRange: value }))} placeholder="0" />
            <AdminTextField label="Max Range" type="number" value={form.maxRange} onChange={(value) => setForm((current) => ({ ...current, maxRange: value }))} placeholder="100" />
          </div>

          <AdminTextField label="Description" textarea value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="Describe the purpose and notes for this test." />

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
            Active in catalogue
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 disabled:opacity-70">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              {editingId ? 'Update Test' : 'Create Test'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Clear</button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Catalogue entries</h3>
              <p className="text-sm text-slate-600">Filter the list by category to focus on a specific specialty.</p>
            </div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All categories' : item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {loading ? (
              <AdminSpinner text="Loading tests" />
            ) : filteredTests.length ? (
              <div className="divide-y divide-slate-100">
                {filteredTests.map((test) => (
                  <div key={test.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{test.name}</p>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{test.testCode}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{test.category}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{test.description || 'No description provided.'}</p>
                      <p className="mt-2 text-sm text-slate-500">Price: {test.price} • Range: {test.minRange ?? '—'} / {test.maxRange ?? '—'} • Unit: {test.unit || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEdit(test)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Edit</button>
                      <button type="button" disabled={saving} onClick={() => deleteTest(test.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-60">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No tests match the current filters.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
