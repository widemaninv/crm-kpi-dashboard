'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Property, PropertyStage, PROPERTY_STAGE_LABELS, HotZone } from '@/types'

const STAGE_BADGE: Record<string, string> = {
  PROPERTIES_LOADED: 'bg-gray-100 text-gray-700',
  PROPERTIES_AI_APPROVED: 'bg-blue-100 text-blue-700',
  PROPERTIES_BOARD_APPROVED: 'bg-green-100 text-green-700',
  PROPERTIES_ASSIGNED_MAIL: 'bg-yellow-100 text-yellow-700',
  PROPERTIES_SENT_MAIL: 'bg-orange-100 text-orange-700',
  OFFERS_MADE: 'bg-purple-100 text-purple-700',
  MAILED_RESPONDED: 'bg-pink-100 text-pink-700',
  WARM_RESPONSES: 'bg-emerald-100 text-emerald-700',
  COLD_KILLED: 'bg-red-100 text-red-700',
  WARM_SIGNED_SUBMITTED: 'bg-teal-100 text-teal-700',
  SIGNED_ACCEPTED: 'bg-cyan-100 text-cyan-700',
  DUE_DILIGENCE_STARTED: 'bg-indigo-100 text-indigo-700',
  DUE_DILIGENCE_COMPLETED: 'bg-violet-100 text-violet-700',
  FINANCING_CONFIRMED: 'bg-blue-100 text-blue-800',
  TITLE_CLOSED: 'bg-green-200 text-green-800',
  LOT_SUBDIVISION_STARTED: 'bg-lime-100 text-lime-700',
  LOTS_SOLD: 'bg-green-300 text-green-900',
}

function PropertiesContent() {
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [hotZones, setHotZones] = useState<HotZone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState(searchParams.get('hot_zone_id') || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [form, setForm] = useState({ apn: '', county: '', state: '', acreage: '', asking_price: '', hot_zone_id: '', underwriting_url: '' })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (stageFilter) params.set('stage', stageFilter)
    if (zoneFilter) params.set('hot_zone_id', zoneFilter)
    if (minPrice) params.set('min_price', minPrice)
    if (maxPrice) params.set('max_price', maxPrice)
    const [pRes, zRes] = await Promise.all([
      fetch(`/api/properties?${params}`),
      fetch('/api/hot-zones'),
    ])
    if (pRes.ok) setProperties(await pRes.json())
    if (zRes.ok) setHotZones(await zRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [search, stageFilter, zoneFilter, minPrice, maxPrice])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      apn: form.apn,
      county: form.county,
      state: form.state,
      acreage: +form.acreage,
      asking_price: +form.asking_price,
      hot_zone_id: form.hot_zone_id,
      underwriting_url: form.underwriting_url || null,
    }
    const res = await fetch('/api/properties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setShowForm(false)
      setForm({ apn: '', county: '', state: '', acreage: '', asking_price: '', hot_zone_id: '', underwriting_url: '' })
      load()
    }
  }

  const boardApprovedZones = hotZones.filter(z => z.stage === 'HOT_ZONES_BOARD_APPROVED')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">
          + New Property
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search APN, county…" className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[180px]" />
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All stages</option>
          {Object.entries(PROPERTY_STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All hot zones</option>
          {hotZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <input
          type="number"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          placeholder="Min price ($)"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
        />
        <input
          type="number"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          placeholder="Max price ($)"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
        />
        {(minPrice || maxPrice) && (
          <button onClick={() => { setMinPrice(''); setMaxPrice('') }} className="text-sm text-gray-500 hover:text-gray-700 px-2">
            Clear price
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Property</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">APN *</label>
              <input required value={form.apn} onChange={e => setForm({...form, apn: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hot Zone *</label>
              <select required value={form.hot_zone_id} onChange={e => setForm({...form, hot_zone_id: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">Select…</option>
                {boardApprovedZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
              <input required value={form.county} onChange={e => setForm({...form, county: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input required value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acreage *</label>
              <input type="number" required value={form.acreage} onChange={e => setForm({...form, acreage: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($) *</label>
              <input type="number" required value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Underwriting URL</label>
              <input type="url" value={form.underwriting_url} onChange={e => setForm({...form, underwriting_url: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Create</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading…</div>
      ) : properties.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No properties found.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">APN</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">County / State</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acreage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Asking Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Hot Zone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}`} className="font-medium text-indigo-600 hover:underline">{p.apn}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.county}, {p.state}</td>
                  <td className="px-4 py-3 text-gray-600">{p.acreage} ac</td>
                  <td className="px-4 py-3 text-gray-600">${p.asking_price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{(p as any).hot_zones_crm?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STAGE_BADGE[p.stage] || 'bg-gray-100 text-gray-700'}`}>
                      {PROPERTY_STAGE_LABELS[p.stage]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <PropertiesContent />
    </Suspense>
  )
}
