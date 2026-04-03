'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Property, PROPERTY_STAGE_LABELS, PropertyStage, Note, StageEvent, LotSale, ResponseType } from '@/types'

const STAGE_ORDER: PropertyStage[] = [
  'PROPERTIES_LOADED','PROPERTIES_AI_APPROVED','PROPERTIES_BOARD_APPROVED',
  'PROPERTIES_ASSIGNED_MAIL','PROPERTIES_SENT_MAIL','OFFERS_MADE','MAILED_RESPONDED',
  'WARM_RESPONSES','COLD_KILLED','WARM_SIGNED_SUBMITTED','SIGNED_ACCEPTED',
  'DUE_DILIGENCE_STARTED','DUE_DILIGENCE_COMPLETED','FINANCING_CONFIRMED',
  'TITLE_CLOSED','LOT_SUBDIVISION_STARTED','LOTS_SOLD',
]

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property & { hot_zones_crm?: any; lot_sales?: LotSale[]; notes_crm?: Note[]; stage_events?: StageEvent[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [responseText, setResponseText] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestion: string; confidence: number; source: string } | null>(null)
  const [showLotForm, setShowLotForm] = useState(false)
  const [lotForm, setLotForm] = useState({ lot_number: '', sale_price: '', sale_date: '', buyer_name: '' })
  const [advanceNote, setAdvanceNote] = useState('')
  const [showAdvance, setShowAdvance] = useState(false)
  const [selectedNextStage, setSelectedNextStage] = useState<PropertyStage | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/properties/${id}`)
    if (res.ok) setProperty(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const approveAI = async () => {
    setAiLoading(true)
    await fetch(`/api/properties/${id}/approve-ai`, { method: 'POST' })
    await load()
    setAiLoading(false)
  }

  const approveBoard = async () => {
    await fetch(`/api/properties/${id}/approve-board`, { method: 'POST' })
    await load()
  }

  const advanceStage = async () => {
    if (!selectedNextStage) return
    await fetch(`/api/properties/${id}/advance-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_stage: selectedNextStage, note: advanceNote }),
    })
    setShowAdvance(false)
    setAdvanceNote('')
    setSelectedNextStage('')
    await load()
  }

  const suggestResponse = async () => {
    const res = await fetch(`/api/properties/${id}/suggest-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text: responseText }),
    })
    if (res.ok) setAiSuggestion(await res.json())
  }

  const confirmResponse = async (type: ResponseType) => {
    const nextStage = type === 'WARM' ? 'WARM_RESPONSES' : 'COLD_KILLED'
    await fetch(`/api/properties/${id}/advance-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_stage: nextStage,
        extra_fields: { response_type: type },
        note: `Response classified as ${type}. Response text: "${responseText}"`,
      }),
    })
    setAiSuggestion(null)
    setResponseText('')
    await load()
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    await fetch(`/api/properties/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newNote }),
    })
    setNewNote('')
    await load()
  }

  const addLot = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`/api/properties/${id}/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lotForm, sale_price: +lotForm.sale_price }),
    })
    setShowLotForm(false)
    setLotForm({ lot_number: '', sale_price: '', sale_date: '', buyer_name: '' })
    await load()
  }

  if (loading) return <div className="text-gray-400 text-center py-12">Loading…</div>
  if (!property) return <div className="text-red-500 text-center py-12">Property not found.</div>

  const currentIdx = STAGE_ORDER.indexOf(property.stage)
  const nextStages = STAGE_ORDER.slice(currentIdx + 1)
  const showMailedResponse = property.stage === 'MAILED_RESPONDED'
  const showLots = property.stage === 'LOT_SUBDIVISION_STARTED' || property.stage === 'LOTS_SOLD'

  return (
    <div>
      <div className="mb-4">
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">← Properties</Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">APN: {property.apn}</h1>
            <div className="text-gray-500 text-sm mt-1">
              {property.county}, {property.state} · {property.acreage} acres · ${property.asking_price.toLocaleString()}
            </div>
            {property.hot_zones_crm && (
              <div className="mt-1">
                <Link href={`/hot-zones/${property.hot_zone_id}`} className="text-sm text-indigo-600 hover:underline">
                  {property.hot_zones_crm.name}
                </Link>
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium">
              {PROPERTY_STAGE_LABELS[property.stage]}
            </span>
            <div className="text-xs text-gray-400 mt-1">Stage {currentIdx + 4 > 3 ? currentIdx + 4 : 'N/A'} of 20</div>
          </div>
        </div>

        {/* Stage progress */}
        <div className="mt-4">
          <div className="flex gap-1">
            {STAGE_ORDER.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded ${i <= currentIdx ? 'bg-indigo-500' : 'bg-gray-200'}`}
                title={PROPERTY_STAGE_LABELS[s]}
              />
            ))}
          </div>
        </div>

        {/* Quick details */}
        <div className="grid grid-cols-4 gap-4 mt-6 text-sm">
          {property.offer_amount && <div><div className="text-xs text-gray-500">Offer</div><div className="font-medium">${property.offer_amount.toLocaleString()}</div></div>}
          {property.response_type && <div><div className="text-xs text-gray-500">Response</div><div className={`font-medium ${property.response_type === 'WARM' ? 'text-green-600' : 'text-red-500'}`}>{property.response_type}</div></div>}
          {property.close_price && <div><div className="text-xs text-gray-500">Close Price</div><div className="font-medium">${property.close_price.toLocaleString()}</div></div>}
          {property.num_lots && <div><div className="text-xs text-gray-500">Lots</div><div className="font-medium">{property.num_lots}</div></div>}
          {property.underwriting_url && <div><div className="text-xs text-gray-500">Underwriting</div><a href={property.underwriting_url} target="_blank" className="text-indigo-600 hover:underline font-medium">View</a></div>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 flex-wrap">
          {property.stage === 'PROPERTIES_LOADED' && (
            <button onClick={approveAI} disabled={aiLoading} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {aiLoading ? 'Running AI Review…' : 'Run AI Review'}
            </button>
          )}
          {property.stage === 'PROPERTIES_AI_APPROVED' && (
            <button onClick={approveBoard} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
              Board Approve
            </button>
          )}
          {nextStages.length > 0 && property.stage !== 'PROPERTIES_LOADED' && property.stage !== 'PROPERTIES_AI_APPROVED' && (
            <button onClick={() => setShowAdvance(!showAdvance)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">
              Advance Stage
            </button>
          )}
        </div>

        {showAdvance && (
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="flex gap-3 items-start">
              <select value={selectedNextStage} onChange={e => setSelectedNextStage(e.target.value as PropertyStage)} className="border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">Select next stage…</option>
                {nextStages.map(s => <option key={s} value={s}>{PROPERTY_STAGE_LABELS[s]}</option>)}
              </select>
              <input value={advanceNote} onChange={e => setAdvanceNote(e.target.value)} placeholder="Optional note…" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
              <button onClick={advanceStage} disabled={!selectedNextStage} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium disabled:opacity-50">Advance</button>
            </div>
          </div>
        )}
      </div>

      {/* Warm/cold response classifier */}
      {showMailedResponse && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Classify Mail Response</h2>
          <div className="flex gap-3 mb-3">
            <textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Paste seller response text…"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm h-24"
            />
          </div>
          <button onClick={suggestResponse} disabled={!responseText} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50">
            AI Suggest
          </button>
          {aiSuggestion && (
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="text-sm font-medium mb-2">
                AI suggests: <span className={aiSuggestion.suggestion === 'WARM' ? 'text-green-600' : 'text-red-500'}>{aiSuggestion.suggestion}</span>
                <span className="text-gray-400 text-xs ml-2">({Math.round(aiSuggestion.confidence * 100)}% confidence · {aiSuggestion.source})</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => confirmResponse('WARM')} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Confirm Warm</button>
                <button onClick={() => confirmResponse('COLD')} className="px-4 py-2 bg-red-500 text-white rounded text-sm">Confirm Cold</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lot sales */}
      {showLots && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Lot Sales</h2>
            <button onClick={() => setShowLotForm(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">+ Add Lot</button>
          </div>
          {showLotForm && (
            <form onSubmit={addLot} className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded">
              <div><label className="text-xs text-gray-600">Lot #</label><input value={lotForm.lot_number} onChange={e => setLotForm({...lotForm, lot_number: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-600">Sale Price *</label><input type="number" required value={lotForm.sale_price} onChange={e => setLotForm({...lotForm, sale_price: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-600">Sale Date *</label><input type="date" required value={lotForm.sale_date} onChange={e => setLotForm({...lotForm, sale_date: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-600">Buyer Name</label><input value={lotForm.buyer_name} onChange={e => setLotForm({...lotForm, buyer_name: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" /></div>
              <div className="col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowLotForm(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded">Add</button>
              </div>
            </form>
          )}
          {property.lot_sales && property.lot_sales.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500 font-medium">Lot #</th><th className="text-left py-2 text-gray-500 font-medium">Sale Price</th><th className="text-left py-2 text-gray-500 font-medium">Date</th><th className="text-left py-2 text-gray-500 font-medium">Buyer</th></tr></thead>
              <tbody>{property.lot_sales.map(l => (
                <tr key={l.id} className="border-b border-gray-100">
                  <td className="py-2">{l.lot_number || '—'}</td>
                  <td className="py-2">${l.sale_price.toLocaleString()}</td>
                  <td className="py-2">{new Date(l.sale_date).toLocaleDateString()}</td>
                  <td className="py-2">{l.buyer_name || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <div className="text-gray-400 text-sm">No lots recorded yet.</div>}
        </div>
      )}

      {/* Stage history */}
      {property.stage_events && property.stage_events.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Stage History</h2>
          <div className="space-y-2">
            {[...property.stage_events].reverse().map(e => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <div className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{new Date(e.created_at).toLocaleDateString()}</div>
                <div>
                  <span className="text-gray-500">{e.from_stage}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="font-medium text-gray-800">{PROPERTY_STAGE_LABELS[e.to_stage as PropertyStage] || e.to_stage}</span>
                  {e.note && <div className="text-gray-500 text-xs mt-0.5">{e.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
        <div className="flex gap-3 mb-4">
          <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Add a note…" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
          <button onClick={addNote} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium">Add</button>
        </div>
        {property.notes_crm && property.notes_crm.length > 0 ? (
          <div className="space-y-3">
            {property.notes_crm.map(n => (
              <div key={n.id} className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-700">{n.body}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : <div className="text-gray-400 text-sm">No notes yet.</div>}
      </div>
    </div>
  )
}
