import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hotZoneId = searchParams.get('hot_zone_id')
  const period = searchParams.get('period') || 'all' // 'weekly' | 'monthly' | 'all'

  let dateFilter: string | null = null
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    dateFilter = d.toISOString()
  } else if (period === 'monthly') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    dateFilter = d.toISOString()
  }

  // Fetch hot zones
  let hzQuery = supabase.from('hot_zones_crm').select('id, stage, created_at')
  if (hotZoneId) hzQuery = hzQuery.eq('id', hotZoneId)
  if (dateFilter) hzQuery = hzQuery.gte('created_at', dateFilter)
  const { data: hotZones } = await hzQuery

  // Fetch properties
  let propQuery = supabase
    .from('properties_crm')
    .select('id, stage, asking_price, offer_amount, close_price, hot_zone_id, created_at, num_lots, total_lot_proceeds')
  if (hotZoneId) propQuery = propQuery.eq('hot_zone_id', hotZoneId)
  if (dateFilter) propQuery = propQuery.gte('created_at', dateFilter)
  const { data: properties } = await propQuery

  // Fetch stage events for time-in-stage
  const { data: stageEvents } = await supabase
    .from('stage_events')
    .select('property_id, from_stage, to_stage, created_at')
    .eq('entity_type', 'PROPERTY')

  const hz = hotZones || []
  const props = properties || []
  const events = stageEvents || []

  // Stage counts
  const hotZoneStages = {
    HOT_ZONES_FOUND: hz.filter(z => z.stage === 'HOT_ZONES_FOUND').length,
    HOT_ZONES_AI_APPROVED: hz.filter(z => z.stage === 'HOT_ZONES_AI_APPROVED').length,
    HOT_ZONES_BOARD_APPROVED: hz.filter(z => z.stage === 'HOT_ZONES_BOARD_APPROVED').length,
  }

  const propertyStages: Record<string, number> = {}
  const propStageKeys = [
    'PROPERTIES_LOADED','PROPERTIES_AI_APPROVED','PROPERTIES_BOARD_APPROVED',
    'PROPERTIES_ASSIGNED_MAIL','PROPERTIES_SENT_MAIL','OFFERS_MADE','MAILED_RESPONDED',
    'WARM_RESPONSES','COLD_KILLED','WARM_SIGNED_SUBMITTED','SIGNED_ACCEPTED',
    'DUE_DILIGENCE_STARTED','DUE_DILIGENCE_COMPLETED','FINANCING_CONFIRMED',
    'TITLE_CLOSED','LOT_SUBDIVISION_STARTED','LOTS_SOLD',
  ]
  for (const s of propStageKeys) {
    propertyStages[s] = props.filter(p => p.stage === s).length
  }

  // Time-in-stage (avg days per stage)
  const stageTimings: Record<string, number[]> = {}
  const propEventsByProp: Record<string, typeof events> = {}
  for (const e of events) {
    if (!e.property_id) continue
    if (!propEventsByProp[e.property_id]) propEventsByProp[e.property_id] = []
    propEventsByProp[e.property_id].push(e)
  }
  for (const propEvents of Object.values(propEventsByProp)) {
    const sorted = propEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    for (let i = 0; i < sorted.length - 1; i++) {
      const stage = sorted[i].to_stage
      const days = (new Date(sorted[i+1].created_at).getTime() - new Date(sorted[i].created_at).getTime()) / 86400000
      if (!stageTimings[stage]) stageTimings[stage] = []
      stageTimings[stage].push(days)
    }
  }
  const avgDaysPerStage: Record<string, number> = {}
  for (const [stage, times] of Object.entries(stageTimings)) {
    avgDaysPerStage[stage] = Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10
  }

  // Capital metrics
  const offerProps = props.filter(p => p.offer_amount && p.offer_amount > 0)
  const expectedCapital = offerProps.reduce((sum, p) => sum + (p.offer_amount || 0) * 0.6, 0)
  const activeStages = ['SIGNED_ACCEPTED','DUE_DILIGENCE_STARTED','DUE_DILIGENCE_COMPLETED','FINANCING_CONFIRMED']
  const underContractProps = props.filter(p => activeStages.includes(p.stage))
  const activeDeals = underContractProps.length
  const activeDealValue = underContractProps.reduce((sum, p) => sum + (p.asking_price || 0), 0)
  const lotsProps = props.filter(p => p.stage === 'LOTS_SOLD')
  const totalLotsSold = lotsProps.reduce((sum, p) => sum + (p.num_lots || 0), 0)
  const totalLotProceeds = lotsProps.reduce((sum, p) => sum + (p.total_lot_proceeds || 0), 0)

  return NextResponse.json({
    hotZoneStages,
    propertyStages,
    avgDaysPerStage,
    expectedCapital,
    activeDeals,
    activeDealValue,
    totalLotsSold,
    totalLotProceeds,
    totals: {
      hotZones: hz.length,
      properties: props.length,
    },
  })
}
