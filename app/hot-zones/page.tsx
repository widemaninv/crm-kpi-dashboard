'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HotZone, HotZoneStage, HOT_ZONE_STAGE_LABELS } from '@/types'

const STAGE_BADGE: Record<HotZoneStage, string> = {
  HOT_ZONES_FOUND: 'bg-gray-100 text-gray-700',
  HOT_ZONES_AI_APPROVED: 'bg-blue-100 text-blue-700',
  HOT_ZONES_BOARD_APPROVED: 'bg-green-100 text-green-700',
}

export default function HotZonesPage() {
  const [zones, setZones] = useState<HotZone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [form, setForm] = useState({ name: '', county: '', state: '', acreage_min: '', acreage_max: '', avg_price_per_acre: '' })

  const load = async () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (stageFilter) params.set('stage', stageFilter)
    const res = await fetch(`/api/hot-zones?${params}`)
    if (res.ok) setZones(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [search, stageFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      county: form.county,
      state: form.state,
      acreage_min: form.acreage_min ? +form.acreage_min : null,
      acreage_max: form.acreage_max ? +form.acreage_max : null,
      avg_price_per_acre: form.avg_price_per_acre ? +form.avg_price_per_acre : null,
    }
    const res = await fetch('/api/hot-zones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: '', county: '', state: '', acreage_min: '', acreage_max: '', avg_price_per_acre: '' })
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hot Zones</h1>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">
          + New Hot Zone
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, county, state…"
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 max-w-sm"
        />
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All stages</option>
          {Object.entries(HOT_ZONE_STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Hot Zone</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Acreage</label>
              <input type="number" value={form.acreage_min} onChange={e => setForm({...form, acreage_min: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Acreage</label>
              <input type="number" value={form.acreage_max} onChange={e => setForm({...form, acreage_max: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avg $/Acre</label>
              <input type="number" value={form.avg_price_per_acre} onChange={e => setForm({...form, avg_price_per_acre: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
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
      ) : zones.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No hot zones yet. Create one to get started.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">County</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acreage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">$/Acre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zones.map(z => (
                <tr key={z.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/hot-zones/${z.id}`} className="font-medium text-indigo-600 hover:underline">{z.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{z.county}</td>
                  <td className="px-4 py-3 text-gray-600">{z.state}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {z.acreage_min || z.acreage_max ? `${z.acreage_min ?? '?'}–${z.acreage_max ?? '?'}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {z.avg_price_per_acre ? `$${z.avg_price_per_acre.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STAGE_BADGE[z.stage]}`}>
                      {HOT_ZONE_STAGE_LABELS[z.stage]}
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
