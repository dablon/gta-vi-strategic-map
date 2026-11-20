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
  | 'marina'
  | 'gas'
  | 'store'
  | 'airport'
  | 'transit'
  | 'modshop'
  | 'hospital'
  | 'vehicle'

export type CategoryGroup = 'robbery' | 'liquidity' | 'escape' | 'prep'

export type RegionId =
  | 'vice_city'
  | 'vice_beach'
  | 'leonida_keys'
  | 'grassrivers'
  | 'capri'
  | 'port_gellhorn'
  | 'ambrosia'
  | 'leonard'
  | 'mount_kalaga'
  | 'hamlet'

export type SecurityLevel = 'low' | 'medium' | 'high'

/** 'exact' = punto de un landmark de gtadb; 'area' = centroide del barrio. */
export type Precision = 'exact' | 'area'

export interface MapLocation {
  id: string
  name: string
  category: LocationCategory
  region: RegionId
  area: string
  /** Coordenadas del mundo del juego en metros (sistema de gtadb.org). */
  wx: number
  wy: number
  precision: Precision
  payoutMin?: number
  payoutMax?: number
  security?: SecurityLevel
  unlock?: string
  tip: string
  lootType?: string
  bestFor?: string
  source: string
}

export interface LandmarkPin {
  id: string
  name: string
  category: LocationCategory
  region: RegionId
  area: string
  wx: number
  wy: number
  unconfirmed: boolean
}

export interface CategoryMeta {
  id: LocationCategory
  group: CategoryGroup
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
