import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const RAILWAY_AI_URL = process.env.RAILWAY_AI_URL || 'https://land-frontage-statewide-api-production.up.railway.app'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data: prop, error: fetchErr } = await supabase
    .from('properties_crm')
    .select('*, hot_zones_crm(name, county, state)')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  let aiResult: { approved?: boolean; score?: number; reason?: string } = {}
  let aiCalled = false

  try {
    const res = await fetch(`${RAILWAY_AI_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'property',
        data: {
          apn: prop.apn,
          county: prop.county,
          state: prop.state,
          acreage: prop.acreage,
          asking_price: prop.asking_price,
          hot_zone: prop.hot_zones_crm?.name,
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      aiResult = await res.json()
      aiCalled = true
    }
  } catch {
    aiCalled = false
  }

  const prevStage = prop.stage
  const { data: updated, error } = await supabase
    .from('properties_crm')
    .update({ stage: 'PROPERTIES_AI_APPROVED' })
    .eq('id', id)
    .select('*, hot_zones_crm(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('stage_events').insert([{
    entity_type: 'PROPERTY',
    property_id: id,
    from_stage: prevStage,
    to_stage: 'PROPERTIES_AI_APPROVED',
    note: aiCalled
      ? `AI review completed. Score: ${aiResult.score ?? 'N/A'}. Reason: ${aiResult.reason ?? 'N/A'}`
      : 'AI endpoint unavailable — auto-approved (manual toggle)',
  }])

  return NextResponse.json({ ...updated, ai_called: aiCalled, ai_result: aiResult })
}
