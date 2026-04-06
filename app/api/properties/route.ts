import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const county = searchParams.get('county')
  const stage = searchParams.get('stage')
  const hot_zone_id = searchParams.get('hot_zone_id')
  const q = searchParams.get('q')
  const min_price = searchParams.get('min_price')
  const max_price = searchParams.get('max_price')

  let query = supabase
    .from('properties_crm')
    .select('*, hot_zones_crm(id, name, county, state)')
    .order('created_at', { ascending: false })

  if (county) query = query.ilike('county', `%${county}%`)
  if (stage) query = query.eq('stage', stage)
  if (hot_zone_id) query = query.eq('hot_zone_id', hot_zone_id)
  if (q) query = query.or(`apn.ilike.%${q}%,county.ilike.%${q}%`)
  if (min_price) query = query.gte('asking_price', parseFloat(min_price))
  if (max_price) query = query.lte('asking_price', parseFloat(max_price))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('properties_crm')
    .insert([{ ...body, stage: 'PROPERTIES_LOADED' }])
    .select('*, hot_zones_crm(id, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('stage_events').insert([{
    entity_type: 'PROPERTY',
    property_id: data.id,
    from_stage: 'CREATED',
    to_stage: 'PROPERTIES_LOADED',
    note: 'Property created',
  }])

  return NextResponse.json(data, { status: 201 })
}
