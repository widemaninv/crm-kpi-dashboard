import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data: prop, error: fetchErr } = await supabase
    .from('properties_crm')
    .select('stage')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const prevStage = prop.stage
  const { data: updated, error } = await supabase
    .from('properties_crm')
    .update({ stage: 'PROPERTIES_BOARD_APPROVED' })
    .eq('id', id)
    .select('*, hot_zones_crm(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('stage_events').insert([{
    entity_type: 'PROPERTY',
    property_id: id,
    from_stage: prevStage,
    to_stage: 'PROPERTIES_BOARD_APPROVED',
    note: 'Board approved',
  }])

  return NextResponse.json(updated)
}
