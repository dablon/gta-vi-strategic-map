// Busca landmarks nuevos en gtadb y los fusiona en public/discovered.json.
// No reescribe los pines curados. Solo añade sitios que no existan ya
// (mismo id, o a menos de 60 m, o el mismo nombre a menos de 400 m).
// Como mucho 40 pines nuevos por pasada, priorizando armas, dinero, droga y coches.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const SRC = 'https://cdn.jsdelivr.net/gh/rolux/gtadb.org@main/map/data/6/landmarks.json'
const OUT = new URL('../public/discovered.json', import.meta.url)
const MAX_NEW = 40
const SAME_SPOT_M = 60
const SAME_NAME_M = 400

const TAGS = {
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
}

const PRIORITY = [
  'ammunation',
  'jewelry',
  'payday',
  'illegal_op',
  'fence',
  'bank_vault',
  'bank_small',
  'paynspray',
  'vehicle',
  'police',
  'marina',
  'safehouse',
  'modshop',
  'stickup',
  'gas',
  'store',
  'airport',
  'transit',
  'hospital',
]

const TIPS = {
  ammunation: 'Armería detectada en gtadb. Carga chaleco antes del golpe.',
  jewelry: 'Joyería o pawn detectado en gtadb. Caja fuerte trasera; vende a Yasmani.',
  payday: 'Financiera detectada en gtadb. Billetes marcados: hay que venderlos.',
  illegal_op: 'Posible front o compound por el nombre en gtadb. Trata el botín como droga o mercancía.',
  fence: 'Comprador detectado en gtadb. Sin fence el loot no es dinero.',
  bank_small: 'Sucursal detectada en gtadb. Confirma en el juego si es bóveda o banco chico.',
  bank_vault: 'Banco grande detectado en gtadb. Las bóvedas abren tarde y dan 4 estrellas.',
  paynspray: 'Pay ’n’ Spray detectado en gtadb. Pierde estrellas y vende el coche con tracker.',
  vehicle: 'Taller, lavadero o concesionario. El coche se roba aquí o se limpia aquí.',
  police: 'Comisaría detectada en gtadb. No planifiques la huida hacia aquí.',
  marina: 'Marina detectada en gtadb. La policía terrestre no sigue al agua.',
  safehouse: 'Safehouse detectada en gtadb. Cambia ropa y guarda la bolsa.',
  modshop: 'Taller de tuning detectado en gtadb.',
  stickup: 'Tienda detectada en gtadb. Caja rápida, entra por atrás.',
  gas: 'Gasolinera nueva en gtadb.',
  store: 'Supermercado nuevo en gtadb.',
  airport: 'Pista nueva en gtadb.',
  transit: 'Estación nueva en gtadb.',
  hospital: 'Hospital nuevo en gtadb.',
}

const REGION_CENTERS = {
  vice_city: [-800, 300],
  vice_beach: [1600, 1300],
  leonida_keys: [-2510, -5919],
  grassrivers: [-4000, -3800],
  capri: [-6896, 210],
  port_gellhorn: [-6575, 3729],
  ambrosia: [-2796, 3954],
  leonard: [-600, 3400],
  mount_kalaga: [-3536, 7046],
  hamlet: [-2691, -3193],
}

const nearestRegion = (x, y) =>
  Object.entries(REGION_CENTERS).sort(
    ([, a], [, b]) => (a[0] - x) ** 2 + (a[1] - y) ** 2 - ((b[0] - x) ** 2 + (b[1] - y) ** 2),
  )[0][0]

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const isDead = (t) =>
  ['demolished', 'closed', 'cancelled', 'residential', 'hotel'].includes(t) ||
  t.startsWith('//doesnt') ||
  t.startsWith('//duplicate')

function classify(name, tags) {
  const tag = tags.find((t) => TAGS[t])
  if (tag) return TAGS[tag]
  if (/field|memorial|visitor center|community center|riverbank|wine bank/i.test(name)) return null
  if (/ammu|firearm|gun shop|hunting supply|pawn & gun|pawn and gun/i.test(name)) return 'ammunation'
  if (/jewel|joyeria|joyería|empeñ|empen|pawn/i.test(name)) return 'jewelry'
  if (/payday|payline|quick buck/i.test(name)) return 'payday'
  if (/pay '?n'? spray/i.test(name)) return 'paynspray'
  if (/dealership|customs|car wash|off-road/i.test(name)) return 'vehicle'
  if (/police|sheriff/i.test(name)) return 'police'
  if (/\bmarina\b/i.test(name)) return 'marina'
  if (/\b(fleeca|lombank|shorefront|druthers|gibson brothers)\b/i.test(name)) return 'bank_small'
  if (/meth|weed|compound|boatworks/i.test(name)) return 'illegal_op'
  if (/liquor|food mart|minimarket|supermarket|24\/7/i.test(name)) return 'stickup'
  return null
}

function readKnown() {
  const files = ['src/data/locations.ts', 'src/data/landmarkPins.ts', 'src/data/meta.ts']
  const ids = new Set()
  const points = []
  for (const file of files) {
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/gtadb-?(L\d+)/g)) ids.add(`gtadb-${m[1]}`)
    for (const m of text.matchAll(/"id": "(gtadb-L\d+)"/g)) ids.add(m[1])
    for (const m of text.matchAll(/at: \[(-?\d+),\s*(-?\d+)\]/g)) {
      points.push({ wx: Number(m[1]), wy: Number(m[2]), name: '' })
    }
    for (const m of text.matchAll(/"wx": (-?\d+),\s*\n\s*"wy": (-?\d+)/g)) {
      points.push({ wx: Number(m[1]), wy: Number(m[2]), name: '' })
    }
    for (const m of text.matchAll(/name: '([^']+)'/g)) points.push({ wx: null, wy: null, name: norm(m[1]) })
    for (const m of text.matchAll(/"name": "([^"]+)"/g)) points.push({ wx: null, wy: null, name: norm(m[1]) })
  }
  return { ids, points }
}

function tooClose(pin, points) {
  const name = norm(pin.name)
  for (const p of points) {
    if (p.wx == null || p.wy == null) continue
    const d = Math.hypot(p.wx - pin.wx, p.wy - pin.wy)
    if (d < SAME_SPOT_M) return true
    if (p.name && p.name === name && d < SAME_NAME_M) return true
  }
  return false
}

const response = await fetch(SRC)
if (!response.ok) {
  console.error(`gtadb respondió ${response.status}. No toco el archivo.`)
  process.exit(1)
}
const data = await response.json()
const curated = readKnown()
const known = { ids: new Set(curated.ids), points: [...curated.points] }

const previous = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, 'utf8'))
  : { updatedAt: null, checkedAt: null, locations: [] }

for (const loc of previous.locations ?? []) {
  known.ids.add(loc.id)
  known.points.push({ wx: loc.wx, wy: loc.wy, name: norm(loc.name) })
}

const candidates = []
for (const [id, v] of Object.entries(data)) {
  const tags = v[6] ?? []
  if (tags.some(isDead)) continue
  const [x, y] = v[1] ?? []
  if (!Number.isFinite(x) || !Number.isFinite(y)) continue
  if (Math.abs(x) > 16000 || Math.abs(y) > 16000) continue
  const parts = String(v[0]).split(', ')
  const name = parts[0] && parts[0] !== '?' ? parts[0] : null
  if (!name) continue
  const category = classify(name, tags)
  if (!category) continue
  const pin = {
    id: `gtadb-${id}`,
    name,
    category,
    region: nearestRegion(x, y),
    area: parts[1] && parts[1] !== '?' ? parts[1] : name,
    wx: Math.round(x),
    wy: Math.round(y),
    precision: 'exact',
    tip: TIPS[category] + (tags.includes('unconfirmed') ? ' gtadb lo marca como no confirmado.' : ''),
    source: `gtadb ${id} (descubierto automáticamente)`,
  }
  if (known.ids.has(pin.id) || tooClose(pin, known.points)) continue
  candidates.push(pin)
  known.ids.add(pin.id)
  known.points.push({ wx: pin.wx, wy: pin.wy, name: norm(pin.name) })
}

candidates.sort(
  (a, b) => PRIORITY.indexOf(a.category) - PRIORITY.indexOf(b.category) || a.name.localeCompare(b.name),
)
const added = candidates.slice(0, MAX_NEW)

const kept = (previous.locations ?? []).filter(
  (loc) => !curated.ids.has(loc.id) && !tooClose(loc, curated.points),
)
const locations = [...kept.filter((loc) => !added.some((n) => n.id === loc.id)), ...added].sort((a, b) =>
  a.id.localeCompare(b.id),
)

const now = new Date().toISOString()
const changed = JSON.stringify(locations) !== JSON.stringify(previous.locations ?? [])
const next = {
  updatedAt: changed ? now : (previous.updatedAt ?? null),
  checkedAt: now,
  addedLastRun: added.length,
  locations,
}

writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`)
console.log(
  `revisado ${now}: ${added.length} nuevos, ${locations.length} en discovered.json, cambio=${changed}`,
)
