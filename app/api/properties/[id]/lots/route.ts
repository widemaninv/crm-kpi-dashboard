import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data, error } = await supabase
    .from('lot_sales')
    .select('*')
    .eq('property_id', id)
    .order('sale_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await request.json()
  const { data: lotData, error } = await supabase
    .from('lot_sales')
    .insert([{ ...body, property_id: id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update property lot totals
  const { data: allLots } = await supabase
    .from('lot_sales')
    .select('sale_price')
    .eq('property_id', id)

  const totalProceeds = (allLots || []).reduce((sum, l) => sum + l.sale_price, 0)
  await supabase
    .from('properties_crm')
    .update({ num_lots: (allLots || []).length, total_lot_proceeds: totalProceeds })
    .eq('id', id)

  return NextResponse.json(lotData, { status: 201 })
}
