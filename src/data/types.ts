export type LocationCategory =
  | 'bank_vault'
  | 'bank_small'
  | 'jewelry'
  | 'stickup'
  | 'illegal_op'
  | 'fence'
  | 'payday'
  | 'paynspray'
  | 'police'
  | 'ammunation'
  | 'safehouse'

export type RegionId =
  | 'vice_city'
  | 'vice_beach'
  | 'leonida_keys'
  | 'grassrivers'
  | 'port_gellhorn'
  | 'ambrosia'
  | 'mount_kalaga'
  | 'hamlet'

export type SecurityLevel = 'low' | 'medium' | 'high'

export interface MapLocation {
  id: string
  name: string
  category: LocationCategory
  region: RegionId
  area: string
  x: number
  y: number
  payoutMin?: number
  payoutMax?: number
  security?: SecurityLevel
  unlock?: string
  tip: string
  lootType?: string
  bestFor?: string
  source: string
}

export interface CategoryMeta {
  id: LocationCategory
  label: string
  short: string
  color: string
  mapUse: string
}

export interface RegionMeta {
  id: RegionId
  label: string
  blurb: string
}
