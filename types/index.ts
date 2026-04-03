export type HotZoneStage =
  | 'HOT_ZONES_FOUND'
  | 'HOT_ZONES_AI_APPROVED'
  | 'HOT_ZONES_BOARD_APPROVED'

export type PropertyStage =
  | 'PROPERTIES_LOADED'
  | 'PROPERTIES_AI_APPROVED'
  | 'PROPERTIES_BOARD_APPROVED'
  | 'PROPERTIES_ASSIGNED_MAIL'
  | 'PROPERTIES_SENT_MAIL'
  | 'OFFERS_MADE'
  | 'MAILED_RESPONDED'
  | 'WARM_RESPONSES'
  | 'COLD_KILLED'
  | 'WARM_SIGNED_SUBMITTED'
  | 'SIGNED_ACCEPTED'
  | 'DUE_DILIGENCE_STARTED'
  | 'DUE_DILIGENCE_COMPLETED'
  | 'FINANCING_CONFIRMED'
  | 'TITLE_CLOSED'
  | 'LOT_SUBDIVISION_STARTED'
  | 'LOTS_SOLD'

export type ResponseType = 'WARM' | 'COLD' | 'NONE'
export type EntityType = 'HOT_ZONE' | 'PROPERTY'

export interface HotZone {
  id: string
  name: string
  county: string
  state: string
  stage: HotZoneStage
  acreage_min: number | null
  acreage_max: number | null
  avg_price_per_acre: number | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  apn: string
  county: string
  state: string
  acreage: number
  asking_price: number
  stage: PropertyStage
  hot_zone_id: string
  underwriting_url: string | null
  offer_amount: number | null
  response_type: ResponseType | null
  close_price: number | null
  close_date: string | null
  num_lots: number | null
  total_lot_proceeds: number | null
  mail_batch_name: string | null
  mail_send_date: string | null
  lender: string | null
  financing_confirmed_date: string | null
  due_diligence_start_date: string | null
  due_diligence_end_date: string | null
  due_diligence_url: string | null
  created_at: string
  updated_at: string
  hot_zones_crm?: HotZone
}

export interface StageEvent {
  id: string
  entity_type: EntityType
  hot_zone_id: string | null
  property_id: string | null
  from_stage: string
  to_stage: string
  note: string | null
  created_at: string
}

export interface Note {
  id: string
  entity_type: EntityType
  hot_zone_id: string | null
  property_id: string | null
  body: string
  created_at: string
}

export interface LotSale {
  id: string
  property_id: string
  lot_number: string | null
  sale_price: number
  sale_date: string
  buyer_name: string | null
  created_at: string
}

export const HOT_ZONE_STAGE_LABELS: Record<HotZoneStage, string> = {
  HOT_ZONES_FOUND: 'Hot zones found',
  HOT_ZONES_AI_APPROVED: 'Hot zones AI-approved',
  HOT_ZONES_BOARD_APPROVED: 'Hot zones board-approved',
}

export const PROPERTY_STAGE_LABELS: Record<PropertyStage, string> = {
  PROPERTIES_LOADED: 'Properties loaded',
  PROPERTIES_AI_APPROVED: 'Properties AI-approved',
  PROPERTIES_BOARD_APPROVED: 'Properties board-approved',
  PROPERTIES_ASSIGNED_MAIL: 'Assigned to mail campaign',
  PROPERTIES_SENT_MAIL: 'Sent to mail',
  OFFERS_MADE: 'Offers made',
  MAILED_RESPONDED: 'Mailed → responded',
  WARM_RESPONSES: 'Warm responses',
  COLD_KILLED: 'Cold responses killed',
  WARM_SIGNED_SUBMITTED: 'Warm → signed offer submitted',
  SIGNED_ACCEPTED: 'Signed offers accepted',
  DUE_DILIGENCE_STARTED: 'Due diligence started',
  DUE_DILIGENCE_COMPLETED: 'Due diligence completed',
  FINANCING_CONFIRMED: 'Financing confirmed',
  TITLE_CLOSED: 'Title + closed',
  LOT_SUBDIVISION_STARTED: 'Lot subdivision started',
  LOTS_SOLD: 'Lots sold',
}

export const ALL_STAGES = [
  { key: 'HOT_ZONES_FOUND', label: 'Hot zones found', entity: 'hot_zone', stageNum: 1 },
  { key: 'HOT_ZONES_AI_APPROVED', label: 'Hot zones AI-approved', entity: 'hot_zone', stageNum: 2 },
  { key: 'HOT_ZONES_BOARD_APPROVED', label: 'Hot zones board-approved', entity: 'hot_zone', stageNum: 3 },
  { key: 'PROPERTIES_LOADED', label: 'Properties loaded', entity: 'property', stageNum: 4 },
  { key: 'PROPERTIES_AI_APPROVED', label: 'Properties AI-approved', entity: 'property', stageNum: 5 },
  { key: 'PROPERTIES_BOARD_APPROVED', label: 'Properties board-approved', entity: 'property', stageNum: 6 },
  { key: 'PROPERTIES_ASSIGNED_MAIL', label: 'Assigned to mail', entity: 'property', stageNum: 7 },
  { key: 'PROPERTIES_SENT_MAIL', label: 'Sent to mail', entity: 'property', stageNum: 8 },
  { key: 'OFFERS_MADE', label: 'Offers made', entity: 'property', stageNum: 9 },
  { key: 'MAILED_RESPONDED', label: 'Mailed → responded', entity: 'property', stageNum: 10 },
  { key: 'WARM_RESPONSES', label: 'Warm responses', entity: 'property', stageNum: 11 },
  { key: 'COLD_KILLED', label: 'Cold responses killed', entity: 'property', stageNum: 12 },
  { key: 'WARM_SIGNED_SUBMITTED', label: 'Warm → signed submitted', entity: 'property', stageNum: 13 },
  { key: 'SIGNED_ACCEPTED', label: 'Signed offers accepted', entity: 'property', stageNum: 14 },
  { key: 'DUE_DILIGENCE_STARTED', label: 'Due diligence started', entity: 'property', stageNum: 15 },
  { key: 'DUE_DILIGENCE_COMPLETED', label: 'Due diligence completed', entity: 'property', stageNum: 16 },
  { key: 'FINANCING_CONFIRMED', label: 'Financing confirmed', entity: 'property', stageNum: 17 },
  { key: 'TITLE_CLOSED', label: 'Title + closed', entity: 'property', stageNum: 18 },
  { key: 'LOT_SUBDIVISION_STARTED', label: 'Lot subdivision started', entity: 'property', stageNum: 19 },
  { key: 'LOTS_SOLD', label: 'Lots sold', entity: 'property', stageNum: 20 },
] as const
