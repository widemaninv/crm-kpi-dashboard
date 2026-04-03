import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const county = searchParams.get('county')
  const state = searchParams.get('state')
  const stage = searchParams.get('stage')
  const q = searchParams.get('q')

  let query = supabase
    .from('hot_zones_crm')
    .select('*')
    .order('created_at', { ascending: false })

  if (county) query = query.ilike('county', `%${county}%`)
  if (state) query = query.ilike('state', `%${state}%`)
  if (stage) query = query.eq('stage', stage)
  if (q) query = query.or(`name.ilike.%${q}%,county.ilike.%${q}%,state.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('hot_zones_crm')
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log stage event
  await supabase.from('stage_events').insert([{
    entity_type: 'HOT_ZONE',
    hot_zone_id: data.id,
    from_stage: 'CREATED',
    to_stage: 'HOT_ZONES_FOUND',
    note: 'Hot zone created',
  }])

  return NextResponse.json(data, { status: 201 })
}
