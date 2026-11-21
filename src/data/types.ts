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
  | 'atm'
  | 'clothing'
  | 'bar'
  | 'collectible'
  | 'stunt'
  | 'animal'
  | 'gym'
  | 'club'
  | 'safe'
  | 'charger'
  | 'garage'
  | 'rare_vehicle'
  | 'food'
  | 'sport'
  | 'activity'
  | 'race'

export type CategoryGroup = 'robbery' | 'liquidity' | 'escape' | 'prep' | 'world'

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

/** Qué tan confiamos en el pin: high = curado, medium = dato confirmado
 *  aguas arriba (gtadb), low = inferido automáticamente, sin verificação en el juego. */
export type Confidence = 'high' | 'medium' | 'low'

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
  confidence?: Confidence
  payoutMin?: number
  payoutMax?: number
  security?: SecurityLevel
  unlock?: string
  tip: string
  lootType?: string
  bestFor?: string
  source: string
  /** Pin propuesto por la comunidad vía GitHub issue (no es dato confirmado). */
  suggested?: boolean
  issueUrl?: string
}

/** Seed curado tal como vive en src/data/seeds.json. Resuelto por resolve.mjs. */
export interface Seed {
  id: string
  name: string
  category: LocationCategory
  region: RegionId
  area: string
  tip: string
  source: string
  payoutMin?: number
  payoutMax?: number
  security?: SecurityLevel
  unlock?: string
  lootType?: string
  bestFor?: string
  /** Coordenadas exactas de gtadb; si faltan se usa el centroide de `centroid ?? area`. */
  at?: [number, number]
  centroid?: string
  /** Radio del jitter cuando la posición es de barrio, no de landmark. */
  spread?: number
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
  confidence: Confidence
}

/** Entrada de public/suggestions.json (issue de GitHub etiquetado pin-suggestion). */
export interface Suggestion {
  issue: number
  url: string
  name: string
  category: LocationCategory
  region?: RegionId
  area?: string
  notes?: string
  wx: number
  wy: number
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
