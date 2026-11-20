import seedsJson from './seeds.json'
import { build } from './resolve.mjs'
import { LANDMARK_PINS } from './landmarkPins'
import type { LocationCategory, MapLocation, Seed } from './types'

const SEEDS = seedsJson as unknown as Seed[]

const LANDMARK_TIPS: Partial<Record<LocationCategory, string>> = {
  gas: 'Gasolinera: caja rápida, pocos testigos. Ideal para encadenar con Pay ’n’ Spray.',
  store: 'Supermercado: atraco menor a la caja. Revisa cámaras antes de sacar el arma.',
  airport: 'Pista o aeródromo: escape aéreo; también fuente de avionetas robables.',
  transit: 'Estación: rompe la línea de visión y pierde la persecución a pie.',
  modshop: 'Taller de tuning: blindaje y motor para el coche de huida.',
  hospital: 'Hospital: reaparición tras un golpe fallido. Planea desde aquí la revancha.',
  stickup: 'Tienda detectada por gtadb. Caja rápida, entra por atrás.',
  police: 'Comisaría o cárcel detectada por gtadb. No planifiques la huida hacia aquí.',
  marina: 'Marina detectada por gtadb. La policía terrestre no sigue al agua.',
}

const landmarkLocations: MapLocation[] = LANDMARK_PINS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region,
  area: p.area,
  wx: p.wx,
  wy: p.wy,
  precision: 'exact',
  confidence: p.confidence,
  tip:
    (LANDMARK_TIPS[p.category] ?? '') +
    (p.unconfirmed ? ' Ubicación marcada como no confirmada en gtadb.' : ''),
  source: `gtadb ${p.id.replace('gtadb-', '')}`,
}))

export const LOCATIONS: MapLocation[] = [...SEEDS.map((s) => build(s)), ...landmarkLocations]

export function formatMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `$${n}`
}

export function payoutLabel(loc: MapLocation): string | null {
  if (loc.payoutMin == null && loc.payoutMax == null) return null
  if (loc.payoutMin != null && loc.payoutMax != null) {
    return `${formatMoney(loc.payoutMin)} – ${formatMoney(loc.payoutMax)}`
  }
  return formatMoney(loc.payoutMax ?? loc.payoutMin ?? 0)
}
