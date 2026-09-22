import { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { ClipboardPlus, LoaderCircle, Trash2, Edit, Search, Plus, ArrowUp, ArrowDown, ListFilter, ChevronDown, X } from 'lucide-react'
import { api } from '../lib/api.js'

// ─── Common lab measurement units ───────────────────────────────────────────
const LAB_UNITS = [
  // Concentration / mass per volume
  'g/dL', 'mg/dL', 'µg/dL', 'ng/dL', 'pg/dL',
  'g/L', 'mg/L', 'µg/L', 'ng/L', 'pg/L',
  'mmol/L', 'µmol/L', 'nmol/L', 'pmol/L',
  'mEq/L', 'µEq/L',
  'mg/24h', 'g/24h', 'µg/24h',
  // Counts / cells
  'cells/µL', '×10³/µL', '×10⁶/µL', '×10⁹/L', '×10¹²/L',
  '/µL', '/mL', '/hpf', '/lpf',
  // Percentage / ratio
  '%', 'ratio', 'index',
  // Volume / size
  'fL', 'pg', 'µm',
  // Enzyme / activity
  'U/L', 'IU/L', 'mIU/L', 'µIU/mL', 'mIU/mL',
  'U/mL', 'kU/L', 'kIU/L',
  // Pressure
  'mm Hg', 'kPa',
  // Time
  'sec', 'min', 'h',
  // Urine specific
  'mOsm/kg', 'mOsm/L', 'g/g creatinine', 'mg/g creatinine',
  // Concentration variants
  'pg/mL', 'ng/mL', 'µg/mL', 'mg/mL', 'IU/mL', 'ng/dL', 'nmol/dL',
  // Misc
  'INR', 'titre', 'copies/mL',
  'mL/min', 'mL/min/1.73m²', 'µg/g', 'mg/kg', 'ng/kg',
]

export function AdminTestsPage() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Form State
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', category: 'Biochemistry', price: '' })
  const [parameters, setParameters] = useState([
    { name: '', unit: '', reference_range: '' }
  ])

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
      const paramNames = (test.parameters || []).map(p => p.name).join(' ').toLowerCase()
      const searchable = [test.name, test.code, test.category, paramNames].join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [search, tests])

  const handleAddParameterRow = () => {
    setParameters((prev) => [...prev, { name: '', unit: '', reference_range: '' }])
  }

  const handleParameterChange = (index, field, value) => {
    setParameters((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleRemoveParameterRow = (index) => {
    if (parameters.length <= 1) {
      setError('A test must contain at least one parameter.')
      return
    }
    setParameters((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveParameter = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= parameters.length) return

    setParameters((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  const resetForm = () => {
    setEditId(null)
    setForm({ name: '', code: '', category: 'Biochemistry', price: '' })
    setParameters([{ name: '', unit: '', reference_range: '' }])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    // Validate parameters
    const invalidParam = parameters.find(p => !p.name.trim())
    if (invalidParam) {
      setError('All parameter rows must have a valid Parameter Name.')
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      parameters: parameters.map((p, idx) => ({
        ...p,
        display_order: idx + 1
      }))
    }

    try {
      if (editId) {
        await api.put(`/tests/${editId}`, payload)
        setMessage('Test panel updated successfully.')
      } else {
        await api.post('/tests', payload)
        setMessage('Test panel created successfully.')
      }
      resetForm()
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
      price: test.price
    })

    if (Array.isArray(test.parameters) && test.parameters.length > 0) {
      setParameters(
        test.parameters.map(p => ({
          id: p.id,
          name: p.name,
          unit: p.unit || '',
          reference_range: p.reference_range || ''
        }))
      )
    } else {
      setParameters([
        { name: test.name, unit: test.unit || '', reference_range: test.reference_range || '' }
      ])
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test panel and all its parameters?')) return
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
              Create multi-parameter test panels (e.g. CBC, LFT, Lipid Profile) and specify measurement units, reference ranges, and display order.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search test name, code or parameter" className="border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-350 font-medium" />
          </label>
        </div>

        {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Left Col: Setup/Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5 font-semibold">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                <ClipboardPlus className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{editId ? 'Modify Test Panel' : 'Add Multi-Parameter Test'}</h3>
                <p className="text-xs text-slate-500 font-medium">{editId ? 'Edit panel properties and parameter ranges' : 'Create a new test with one or multiple parameters'}</p>
              </div>
            </div>

            {/* Test Core Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Test Panel Name" value={form.name} onChange={(value) => setForm((c) => ({ ...c, name: value }))} placeholder="e.g. Complete Blood Count (CBC)" />
              <TextField label="Short Code" value={form.code} onChange={(value) => setForm((c) => ({ ...c, code: value }))} placeholder="e.g. CBC" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</span>
                <select value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900">
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Clinical Pathology">Clinical Pathology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                </select>
              </label>

              <TextField label="Pricing (LKR)" type="number" value={form.price} onChange={(value) => setForm((c) => ({ ...c, price: value }))} placeholder="1200.00" />
            </div>

            {/* Multi-Parameter Dynamic Form Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Test Parameters ({parameters.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddParameterRow}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Parameter
                </button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {parameters.map((param, index) => (
                  <div key={index} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 relative group hover:border-slate-300 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Parameter #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveParameter(index, -1)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 transition"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === parameters.length - 1}
                          onClick={() => handleMoveParameter(index, 1)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 transition"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveParameterRow(index)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition ml-1"
                          title="Remove Parameter"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          required
                          placeholder="Name (e.g. Hemoglobin)"
                          value={param.name}
                          onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <UnitCombobox
                          value={param.unit}
                          onChange={(val) => handleParameterChange(index, 'unit', val)}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Reference (e.g. 13.0 - 17.5)"
                          value={param.reference_range}
                          onChange={(e) => handleParameterChange(index, 'reference_range', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition">
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {editId ? 'Update Test Panel' : 'Add to Catalog'}
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
                  <div key={test.id} className="p-4 space-y-3 group hover:bg-slate-50/50 transition">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100/50 uppercase">
                            {test.code}
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{test.name}</p>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">{test.category}</p>
                      </div>

                      <div className="flex items-center justify-between gap-4 md:justify-end font-semibold">
                        <span className="text-sm font-extrabold text-slate-900">LKR {parseFloat(test.price).toFixed(2)}</span>
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                          <button type="button" onClick={() => handleEdit(test)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-650 transition" title="Edit Test Panel">
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button type="button" onClick={() => handleDelete(test.id)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition" title="Delete Test Panel">
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Parameter Chips / Table list */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Parameters ({(test.parameters || []).length}):
                      </p>
                      <div className="grid gap-1.5">
                        {(test.parameters || []).map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-150">
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Range: <strong className="text-slate-700">{p.reference_range}</strong> {p.unit}
                            </span>
                          </div>
                        ))}
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

// ─── Searchable unit combobox (portal-based to escape overflow containers) ──
function UnitCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropStyle, setDropStyle] = useState({})
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Compute dropdown position from the trigger's bounding rect
  const updatePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const viewportH = window.innerHeight
    const dropH = 192 // max-h ~176px + border
    const spaceBelow = viewportH - rect.bottom
    const goAbove = spaceBelow < dropH && rect.top > dropH

    setDropStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(goAbove
        ? { bottom: viewportH - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    })
  }

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !document.getElementById('unit-combobox-portal')?.contains(e.target)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LAB_UNITS
    return LAB_UNITS.filter((u) => u.toLowerCase().includes(q))
  }, [query])

  const handleSelect = (unit) => {
    onChange(unit)
    setOpen(false)
    setQuery('')
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setOpen(true)
  }

  const handleClear = () => {
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'Enter' && open && filtered.length === 1) {
      e.preventDefault()
      handleSelect(filtered[0])
    }
  }

  // Portal target — reuse a single div appended to body
  const getPortalRoot = () => {
    let el = document.getElementById('unit-combobox-portal')
    if (!el) {
      el = document.createElement('div')
      el.id = 'unit-combobox-portal'
      document.body.appendChild(el)
    }
    return el
  }

  const dropdown = open ? (
    <div style={dropStyle} className="rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-[11px] text-slate-400 italic">
          No match — &ldquo;{query}&rdquo; will be saved as-is
        </div>
      ) : (
        <ul className="max-h-44 overflow-y-auto divide-y divide-slate-50">
          {filtered.map((unit) => (
            <li key={unit}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(unit) }}
                className={`w-full px-3 py-1.5 text-left text-xs font-medium transition
                  ${value === unit
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {unit}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null

  return (
    <>
      <div ref={containerRef} className="relative">
        <div
          className={`flex items-center gap-1 rounded-xl border bg-white px-2 py-1.5 transition
            ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
        >
          <Search className="h-3 w-3 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={value || 'Unit (e.g. g/dL)'}
            value={open ? query : value}
            onFocus={() => { setOpen(true); setQuery('') }}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
          />
          {value ? (
            <button type="button" onClick={handleClear} className="shrink-0 text-slate-400 hover:text-slate-700 transition">
              <X className="h-3 w-3" />
            </button>
          ) : (
            <button type="button" onClick={() => { setOpen((o) => !o); inputRef.current?.focus() }} className="shrink-0 text-slate-400 hover:text-slate-600 transition">
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Render dropdown outside the scroll container via portal */}
      {open && typeof document !== 'undefined'
        ? ReactDOM.createPortal(dropdown, getPortalRoot())
        : null}
    </>
  )
}

