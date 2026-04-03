import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PropertyStage } from '@/types'

const STAGE_ORDER: PropertyStage[] = [
  'PROPERTIES_LOADED',
  'PROPERTIES_AI_APPROVED',
  'PROPERTIES_BOARD_APPROVED',
  'PROPERTIES_ASSIGNED_MAIL',
  'PROPERTIES_SENT_MAIL',
  'OFFERS_MADE',
  'MAILED_RESPONDED',
  'WARM_RESPONSES',
  'COLD_KILLED',
  'WARM_SIGNED_SUBMITTED',
  'SIGNED_ACCEPTED',
  'DUE_DILIGENCE_STARTED',
  'DUE_DILIGENCE_COMPLETED',
  'FINANCING_CONFIRMED',
  'TITLE_CLOSED',
  'LOT_SUBDIVISION_STARTED',
  'LOTS_SOLD',
]

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await request.json()
  const { to_stage, note, extra_fields } = body

  const { data: prop, error: fetchErr } = await supabase
    .from('properties_crm')
    .select('stage')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const fromStage = prop.stage
  const updatePayload: Record<string, unknown> = { stage: to_stage, ...(extra_fields || {}) }

  const { data: updated, error } = await supabase
    .from('properties_crm')
    .update(updatePayload)
    .eq('id', id)
    .select('*, hot_zones_crm(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('stage_events').insert([{
    entity_type: 'PROPERTY',
    property_id: id,
    from_stage: fromStage,
    to_stage,
    note: note || null,
  }])

  return NextResponse.json(updated)
}
