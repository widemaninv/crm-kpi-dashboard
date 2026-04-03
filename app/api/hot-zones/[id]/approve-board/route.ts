import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data: zone, error: fetchErr } = await supabase
    .from('hot_zones_crm')
    .select('stage')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: 'Hot zone not found' }, { status: 404 })

  const prevStage = zone.stage
  const { data: updated, error } = await supabase
    .from('hot_zones_crm')
    .update({ stage: 'HOT_ZONES_BOARD_APPROVED' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('stage_events').insert([{
    entity_type: 'HOT_ZONE',
    hot_zone_id: id,
    from_stage: prevStage,
    to_stage: 'HOT_ZONES_BOARD_APPROVED',
    note: 'Board approved',
  }])

  return NextResponse.json(updated)
}
