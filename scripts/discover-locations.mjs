// Busca landmarks nuevos en gtadb y marcadores de IGN Leonida, y los fusiona
// en public/discovered.json. No reescribe los pines curados (src/data/seeds.json).
// Solo añade sitios nuevos (mismo id, o a menos de 60 m, o el mismo nombre a
// menos de 400 m contra cualquier pin ya conocido). gtadb tiene tope de 40
// pines nuevos por pasada. IGN entra entero: son las mismas ubicaciones del
// mapa interactivo, ya clasificadas. Solo escribe el archivo si cambió la
// lista. Con el schema de gtadb roto, sale 1 y no toca nada. Si IGN falla,
// se conservan los pines ign-* ya publicados.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import {
  classify,
  eachUsable,
  LANDMARKS_SRC,
  norm,
  parseLandmarks,
  readKnownPoints,
  tooClose,
} from './lib/gtadb.mjs'
import { nearestRegion } from '../src/data/resolve.mjs'
import {
  disambiguateNames,
  fetchIgnMarkers,
  fitIgnProjection,
  ignMarkerToPin,
  matchControlPairs,
  readControlPoints,
} from './lib/ign.mjs'

const OUT = new URL('../public/discovered.json', import.meta.url)
const MAX_NEW = 40
const SCHEMA_VERSION = 3

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

const CONF_RANK = { high: 0, medium: 1, low: 2 }

/** Nombres dignos para candidatos secundarios sin nombre en gtadb. */
const GUESS_NAME = {
  stickup: 'Posible tienda robable',
  transit: 'Posible parada de transporte',
  illegal_op: 'Posible front / almacén',
  police: 'Posible edificio gubernamental',
}

const response = await fetch(LANDMARKS_SRC)
if (!response.ok) {
  console.error(`gtadb respondió ${response.status}. No toco el archivo.`)
  process.exit(1)
}

let entries
try {
  entries = parseLandmarks(await response.json())
} catch (err) {
  console.error(`gtadb: ${err.message ?? err}. No toco el archivo.`)
  process.exit(1)
}

const upstreamIds = new Set(entries.map(([id]) => id))
const curated = readKnownPoints(import.meta.url)
const known = { ids: new Set(curated.ids), points: [...curated.points] }

const previous = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, 'utf8'))
  : { updatedAt: null, locations: [] }

const previousLocations = previous.locations ?? []

// Los gtadb ya publicados siguen contando como conocidos. Los ign-* se
// reconstruyen en cada pasada, así que no deben bloquearse a sí mismos.
for (const loc of previousLocations) {
  if (String(loc.id).startsWith('ign-')) continue
  known.ids.add(loc.id)
  known.points.push({ wx: loc.wx, wy: loc.wy, name: norm(loc.name) })
}

const candidates = []
for (const lm of eachUsable(entries)) {
  const match = classify(lm.name ?? '', lm.tags)
  if (!match) continue
  const name = lm.name ?? `${GUESS_NAME[match.category] ?? 'Posible objetivo'} (${lm.area ?? lm.region ?? 'zona'})`
  if (name.length < 2 || name.length > 120) continue
  const pin = {
    id: `gtadb-${lm.id}`,
    name,
    category: match.category,
    region: nearestRegion(lm.x, lm.y),
    area: lm.area ?? name,
    wx: lm.x,
    wy: lm.y,
    precision: 'exact',
    confidence: lm.unconfirmed && match.confidence === 'medium' ? 'low' : match.confidence,
    tip:
      TIPS[match.category] +
      (lm.unconfirmed ? ' gtadb lo marca como no confirmado.' : '') +
      (match.via === 'secondary' ? ' Inferido del tipo de edificio en gtadb; sin verificación.' : ''),
    source: `gtadb ${lm.id} (descubierto automáticamente)`,
  }
  if (known.ids.has(pin.id) || tooClose(pin, known.points)) continue
  candidates.push(pin)
  known.ids.add(pin.id)
  known.points.push({ wx: pin.wx, wy: pin.wy, name: norm(pin.name) })
}

// Confirmados primero (confidence), luego PRIORITY estratégica, luego nombre:
// si no, 40 "industrial→ilegal" sin verificar tapan el tope antes que los
// hashtags reales de gtadb. Sucesivas pasadas del cron van drenando el resto.
candidates.sort(
  (a, b) =>
    CONF_RANK[a.confidence] - CONF_RANK[b.confidence] ||
    PRIORITY.indexOf(a.category) - PRIORITY.indexOf(b.category) ||
    a.name.localeCompare(b.name),
)
const added = candidates.slice(0, MAX_NEW)

// Mantengo lo publicado de gtadb que sigue vigente. Los ign-* no se heredan:
// salen frescos de esta pasada, o se quedan los viejos si IGN no respondió.
const kept = previousLocations.filter(
  (loc) =>
    !String(loc.id).startsWith('ign-') &&
    !curated.ids.has(loc.id) &&
    !tooClose(loc, curated.points) &&
    upstreamIds.has(loc.id.replace('gtadb-', '')) &&
    !added.some((n) => n.id === loc.id),
)

let ignNote = 'IGN no disponible; se conservan los pines ign-* previos'
let ignAdded = []
try {
  const markers = await fetchIgnMarkers()
  const projection = fitIgnProjection(matchControlPairs(markers, readControlPoints(import.meta.url)))
  if (!projection) {
    ignNote = `IGN respondió ${markers.length} marcadores, pero la proyección no ancla (menos de 6 pares o mediana > 40 m). No publico pines nuevos de IGN.`
    ignAdded = previousLocations.filter((loc) => String(loc.id).startsWith('ign-'))
  } else {
    const seen = new Set()
    const fresh = []
    for (const marker of markers) {
      const pin = ignMarkerToPin(marker, projection.project)
      if (!pin || seen.has(pin.id)) continue
      seen.add(pin.id)
      fresh.push(pin)
    }
    disambiguateNames(fresh)
    // Cajeros, stunts y coleccionables van densos: 60 m funde máquinas distintas.
    // 20 m solo descarta el mismo punto proyectado dos veces.
    const dense = new Set(['atm', 'stunt', 'collectible'])
    for (const pin of fresh) {
      const crowded = dense.has(pin.category)
        ? known.points.some((p) => Math.hypot(p.wx - pin.wx, p.wy - pin.wy) < 20)
        : tooClose(pin, known.points)
      if (known.ids.has(pin.id) || crowded) continue
      ignAdded.push(pin)
      known.ids.add(pin.id)
      known.points.push({ wx: pin.wx, wy: pin.wy, name: norm(pin.name) })
    }
    ignNote = `marcadores ${markers.length} · anclas ${projection.inliers} · mediana ${Math.round(projection.median)} m · nuevos ${ignAdded.length}`
  }
} catch (err) {
  ignNote = `IGN falló (${err.message ?? err}). Se conservan los pines ign-* previos.`
  ignAdded = previousLocations.filter((loc) => String(loc.id).startsWith('ign-'))
  console.error(ignNote)
}

const locations = [...kept, ...added, ...ignAdded].sort((a, b) => a.id.localeCompare(b.id))

const changed = JSON.stringify(locations) !== JSON.stringify(previousLocations)
// Cualquier id previo que ya no está en locations es "removido":
const removedList = previousLocations.filter((l) => !locations.some((n) => n.id === l.id))

if (changed) {
  writeFileSync(
    OUT,
    `${JSON.stringify(
      { schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString(), locations },
      null,
      2,
    )}\n`,
  )
}

// Resumen para el paso de Actions: tabla de agregados por categoría.
const byCat = {}
for (const p of added) byCat[p.category] = (byCat[p.category] ?? 0) + 1
const removedByCat = {}
for (const p of removedList) removedByCat[p.category] = (removedByCat[p.category] ?? 0) + 1
const lowConf = locations.filter((l) => l.confidence === 'low').length

console.log('## gtadb discovery')
console.log('')
console.log(`- revisado: ${new Date().toISOString()}`)
console.log(`- landmarks fuente: ${entries.length}`)
console.log(`- nuevos: ${added.length}${Object.keys(byCat).length ? ` (${Object.entries(byCat).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}`)
console.log(`- removidos (baja upstream o solapa con curados): ${removedList.length}${Object.keys(removedByCat).length ? ` (${Object.entries(removedByCat).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}`)
console.log(`- publicados en discovered.json: ${locations.length} · sin confirmar: ${lowConf}`)
console.log(`- archivo: ${changed ? 'ACTUALIZADO' : 'sin cambios (no hay commit ni deploy)'}`)
console.log('')
console.log('## ign discovery')
console.log('')
console.log(`- ${ignNote}`)
if (ignNote.includes('nuevos')) {
  const ignByCat = {}
  for (const p of ignAdded) ignByCat[p.category] = (ignByCat[p.category] ?? 0) + 1
  console.log(`- por categoría: ${Object.entries(ignByCat).map(([k, v]) => `${k}: ${v}`).join(', ')}`)
}
