import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const RAILWAY_AI_URL = process.env.RAILWAY_AI_URL || 'https://land-frontage-statewide-api-production.up.railway.app'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data: zone, error: fetchErr } = await supabase
    .from('hot_zones_crm')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: 'Hot zone not found' }, { status: 404 })

  let aiResult: { approved?: boolean; score?: number; reason?: string } = {}
  let aiCalled = false

  // Try Railway AI endpoint
  try {
    const res = await fetch(`${RAILWAY_AI_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hot_zone',
        data: {
          name: zone.name,
          county: zone.county,
          state: zone.state,
          acreage_min: zone.acreage_min,
          acreage_max: zone.acreage_max,
          avg_price_per_acre: zone.avg_price_per_acre,
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      aiResult = await res.json()
      aiCalled = true
    }
  } catch {
    // AI unavailable — auto-approve with note
    aiCalled = false
  }

  const prevStage = zone.stage
  const { data: updated, error: updateErr } = await supabase
    .from('hot_zones_crm')
    .update({ stage: 'HOT_ZONES_AI_APPROVED' })
    .eq('id', id)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  await supabase.from('stage_events').insert([{
    entity_type: 'HOT_ZONE',
    hot_zone_id: id,
    from_stage: prevStage,
    to_stage: 'HOT_ZONES_AI_APPROVED',
    note: aiCalled
      ? `AI review completed. Score: ${aiResult.score ?? 'N/A'}. Reason: ${aiResult.reason ?? 'N/A'}`
      : 'AI endpoint unavailable — auto-approved (manual toggle)',
  }])

  return NextResponse.json({
    ...updated,
    ai_called: aiCalled,
    ai_result: aiResult,
  })
}
