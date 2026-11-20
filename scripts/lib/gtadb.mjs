// Acceso y clasificación de landmarks de gtadb.org. Compartido por
// extract-landmarks.mjs y discover-locations.mjs para que la extracción
// "infraestructura" y el descubrimiento automático no puedan disentir.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build, nearestRegion } from '../../src/data/resolve.mjs'

export const LANDMARKS_SRC =
  'https://cdn.jsdelivr.net/gh/rolux/gtadb.org@main/map/data/6/landmarks.json'

export const SAME_SPOT_M = 60
export const SAME_NAME_M = 400

/** Hashtags confirmados de la comunidad gtadb. medium: el sitio existe, la
 *  semántica estratégica la infiere el tag. */
export const HASH_TAGS = {
  '#guns': 'ammunation',
  '#fence': 'fence',
  "#pay'n'spray": 'paynspray',
  '#police': 'police',
  '#marina': 'marina',
  '#safehouse': 'safehouse',
  '#carwash': 'vehicle',
  '#bikeshop': 'vehicle',
  '#modshop': 'modshop',
  '#gas': 'gas',
  '#supermarket': 'store',
  '#airport': 'airport',
  '#train': 'transit',
  '#metro': 'transit',
  '#metromover': 'transit',
  '#hospital': 'hospital',
  // Añadidos en la auditoría de 2026-11: hashtags que gtadb publica y se ignoraban.
  '#bus': 'transit',
  '#jail': 'police',
  '#airbase': 'airport',
  '#bar': 'stickup',
  '#nightclub': 'stickup',
  '#stripclub': 'stickup',
  '#liquor': 'stickup',
  '#fastfood': 'stickup',
  '#food': 'stickup',
  '#vendor': 'stickup',
  '#electronics': 'stickup',
  '#pharmacy': 'stickup',
  '#cinema': 'stickup',
  '#hair': 'stickup', // precedente en juego: Pearl House Hair Salon es stick-up
  '#clothes': 'stickup', // precedente: Glamour Clothing
  '#tattoos': 'stickup',
  '#shoes': 'stickup',
}

/** Tags de categoría no-hastag de gtadb: señalan tipo de edificio, no negocio
 *  confirmado. Solo aportan pines confidence 'low' (ocultos por defecto). */
export const SECONDARY_TAGS = {
  retail: 'stickup',
  restaurant: 'stickup',
  transportation: 'transit',
  industrial: 'illegal_op',
  government: 'police',
}

const REJECT_NAME = /field|memorial|visitor center|community center|riverbank|wine bank/i

/** Patrones por nombre (guías post-lanzamiento). medium: el nombre dice qué es. */
export const NAME_RULES = [
  [/ammu|firearm|gun shop|hunting supply|pawn & gun|pawn and gun/i, 'ammunation'],
  [/jewel|joyeria|joyería|empeñ|empen|pawn/i, 'jewelry'],
  [/payday|payline|quick buck/i, 'payday'],
  [/pay '?n'? spray/i, 'paynspray'],
  [/dealership|customs|car wash|off-road/i, 'vehicle'],
  [/police|sheriff/i, 'police'],
  [/\bmarina\b/i, 'marina'],
  [/\b(fleeca|lombank|shorefront|druthers|gibson brothers)\b/i, 'bank_small'],
  [/meth|weed|compound|boatworks/i, 'illegal_op'],
  [/liquor|food mart|minimarket|supermarket|24\/7/i, 'stickup'],
]

const DEAD_WORDS = ['demolished', 'closed', 'cancelled', 'residential', 'hotel']

export function isDead(t) {
  return (
    DEAD_WORDS.includes(t) ||
    t === '//may-not-exist' ||
    t.startsWith('//doesnt') ||
    t.startsWith('//duplicate')
  )
}

export function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** name/tags → {category, confidence, via} o null si no es robable/inútil. */
export function classify(name, tags) {
  if (REJECT_NAME.test(name)) return null
  const hash = tags.find((t) => HASH_TAGS[t])
  if (hash) return { category: HASH_TAGS[hash], confidence: 'medium', via: 'hash' }
  if (name) {
    for (const [pattern, category] of NAME_RULES) {
      if (pattern.test(name)) return { category, confidence: 'medium', via: 'name' }
    }
  }
  const secondary = tags.find((t) => SECONDARY_TAGS[t])
  if (secondary) return { category: SECONDARY_TAGS[secondary], confidence: 'low', via: 'secondary' }
  return null
}

/** Descuenta confianza: un landmark marcado 'unconfirmed' por gtadb no es dato firme. */
export function applyUnconfirmed(match, unconfirmed) {
  if (!unconfirmed) return match
  return { ...match, confidence: match.confidence === 'medium' ? 'low' : match.confidence }
}

/**
 * Valida la forma del JSON de gtadb antes de tocar nada. Si el upstream
 * cambia de esquema (reordena campos, encoje el dataset), lanza: es mejor
 * un runner rojo que escribir basura silenciosa.
 */
export function parseLandmarks(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('gtadb: respuesta no es un objeto de landmarks')
  }
  const entries = Object.entries(raw)
  if (entries.length < 2000) {
    throw new Error(`gtadb: solo ${entries.length} landmarks (esperados >2000). Esquema cambiado?`)
  }
  let malformed = 0
  for (const [, v] of entries) {
    if (!Array.isArray(v) || v.length < 7 || typeof v[0] !== 'string' || !Array.isArray(v[6])) {
      malformed++
    }
  }
  if (malformed / entries.length > 0.05) {
    throw new Error(`gtadb: ${malformed}/${entries.length} entradas malformadas. Esquema cambiado?`)
  }
  return entries
}

/** Itera landmarks válidos y produce candidatos con nombre, coordenadas y match. */
export function* eachUsable(entries) {
  for (const [id, v] of entries) {
    const tags = v[6] ?? []
    if (tags.some(isDead)) continue
    const [x, y] = v[1] ?? []
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (Math.abs(x) > 16000 || Math.abs(y) > 16000) continue
    const parts = String(v[0]).split(', ')
    const name = parts[0] && parts[0] !== '?' ? parts[0] : null
    const area = parts[1] && parts[1] !== '?' ? parts[1] : null
    yield { id, name, area, x: Math.round(x), y: Math.round(y), tags, unconfirmed: tags.includes('unconfirmed') }
  }
}

/** Puntos conhecidos: todo lo que ya está en el repo (curado + generado + descubierto). */
export function readKnownPoints(root) {
  const points = []
  const ids = new Set()
  const readJson = (rel) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, root)), 'utf8'))

  for (const seed of readJson('../src/data/seeds.json')) {
    const pin = build(seed)
    ids.add(pin.id)
    points.push({ wx: pin.wx, wy: pin.wy, name: norm(pin.name) })
  }
  for (const p of readJson('../src/data/landmarkPins.json')) {
    ids.add(p.id)
    points.push({ wx: p.wx, wy: p.wy, name: norm(p.name) })
  }
  return { ids, points }
}

/** Dedupe correcto: coordenada O nombre-a-distancia contra el mismo punto. */
export function tooClose(pin, points) {
  const name = norm(pin.name ?? '')
  for (const p of points) {
    const d = Math.hypot(p.wx - pin.wx, p.wy - pin.wy)
    if (d < SAME_SPOT_M) return true
    if (p.name && name && p.name === name && d < SAME_NAME_M) return true
  }
  return false
}

export { build, nearestRegion }
