'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HotZone, HOT_ZONE_STAGE_LABELS, HotZoneStage, Note, StageEvent, Property, PROPERTY_STAGE_LABELS } from '@/types'

const STAGE_BADGE: Record<HotZoneStage, string> = {
  HOT_ZONES_FOUND: 'bg-gray-100 text-gray-700',
  HOT_ZONES_AI_APPROVED: 'bg-blue-100 text-blue-700',
  HOT_ZONES_BOARD_APPROVED: 'bg-green-100 text-green-700',
}

export default function HotZoneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [zone, setZone] = useState<HotZone & { properties_crm?: Property[] } | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [events, setEvents] = useState<StageEvent[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  const load = useCallback(async () => {
    const [zRes, nRes] = await Promise.all([
      fetch(`/api/hot-zones/${id}`),
      fetch(`/api/hot-zones/${id}/notes`),
    ])
    if (zRes.ok) setZone(await zRes.json())
    if (nRes.ok) setNotes(await nRes.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const approveAI = async () => {
    setAiLoading(true)
    const res = await fetch(`/api/hot-zones/${id}/approve-ai`, { method: 'POST' })
    if (res.ok) await load()
    setAiLoading(false)
  }

  const approveBoard = async () => {
    const res = await fetch(`/api/hot-zones/${id}/approve-board`, { method: 'POST' })
    if (res.ok) await load()
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    await fetch(`/api/hot-zones/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newNote }),
    })
    setNewNote('')
    const res = await fetch(`/api/hot-zones/${id}/notes`)
    if (res.ok) setNotes(await res.json())
  }

  if (loading) return <div className="text-gray-400 text-center py-12">Loading…</div>
  if (!zone) return <div className="text-red-500 text-center py-12">Hot zone not found.</div>

  const canAiApprove = zone.stage === 'HOT_ZONES_FOUND'
  const canBoardApprove = zone.stage === 'HOT_ZONES_AI_APPROVED'

  return (
    <div>
      <div className="mb-4">
        <Link href="/hot-zones" className="text-sm text-indigo-600 hover:underline">← Hot Zones</Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{zone.name}</h1>
            <div className="text-gray-500 text-sm mt-1">{zone.county}, {zone.state}</div>
          </div>
          <span className={`inline-flex px-3 py-1 rounded text-sm font-medium ${STAGE_BADGE[zone.stage]}`}>
            {HOT_ZONE_STAGE_LABELS[zone.stage]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Acreage Range</div>
            <div className="text-lg font-semibold text-gray-800 mt-1">
              {zone.acreage_min || zone.acreage_max ? `${zone.acreage_min ?? '?'}–${zone.acreage_max ?? '?'} ac` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Avg $/Acre</div>
            <div className="text-lg font-semibold text-gray-800 mt-1">
              {zone.avg_price_per_acre ? `$${zone.avg_price_per_acre.toLocaleString()}` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Properties</div>
            <div className="text-lg font-semibold text-gray-800 mt-1">{zone.properties_crm?.length ?? 0}</div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {canAiApprove && (
            <button
              onClick={approveAI}
              disabled={aiLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {aiLoading ? 'Running AI Review…' : 'Run AI Review'}
            </button>
          )}
          {canBoardApprove && (
            <button
              onClick={approveBoard}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
            >
              Board Approve
            </button>
          )}
          {zone.stage === 'HOT_ZONES_BOARD_APPROVED' && (
            <Link
              href={`/properties?hot_zone_id=${id}`}
              className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
            >
              View Properties
            </Link>
          )}
        </div>
      </div>

      {/* Properties list */}
      {zone.properties_crm && zone.properties_crm.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Properties ({zone.properties_crm.length})</h2>
          <div className="space-y-2">
            {zone.properties_crm.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <Link href={`/properties/${p.id}`} className="font-medium text-indigo-600 hover:underline text-sm">
                  {p.apn} — {p.county}
                </Link>
                <span className="text-xs text-gray-500">{PROPERTY_STAGE_LABELS[p.stage]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Activity Log</h2>
        <div className="flex gap-3 mb-4">
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()}
            placeholder="Add a note…"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <button onClick={addNote} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Add</button>
        </div>
        {notes.length === 0 ? (
          <div className="text-gray-400 text-sm">No notes yet.</div>
        ) : (
          <div className="space-y-3">
            {notes.map(n => (
              <div key={n.id} className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-700">{n.body}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
