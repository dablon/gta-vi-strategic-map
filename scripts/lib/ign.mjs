// Marcadores del mapa interactivo de IGN (MapGenie, Leonida) proyectados a
// metros de gtadb. IGN publica lat/lng de un mapa georeferenciado en un
// recuadro de ~1°; no son coordenadas del juego. La escala se calibra en cada
// pasada contra pines ya conocidos (seeds con `at` + landmarkPins).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { norm } from './gtadb.mjs'
import { nearestArea, nearestRegion } from '../../src/data/resolve.mjs'

export const IGN_MARKERS_URL = 'https://mollusk.apis.ign.com/graphql'
const PERSISTED_QUERY = 'ca69199362b91ef6e85d44bd89c9ffa827c96de0e3c75abf48db4420401ef370'

/** typeSlug de IGN → categoría del atlas. Lo que IGN no mapea aquí (animales,
 *  coleccionables, stunts, cajeros) no entra: no tiene categoría en la app. */
export const IGN_TYPES = {
  29041: { category: 'ammunation', label: 'Ammu-Nation' },
  29022: { category: 'bank_small', label: 'Bank' },
  29023: { category: 'bank_vault', label: 'Big Bank' },
  29024: { category: 'payday', label: 'Payday Loans' },
  29025: { category: 'jewelry', label: 'Low-End Jewelry' },
  29026: { category: 'jewelry', label: 'High-End Jewelry' },
  29027: { category: 'jewelry', label: 'Pawn Shop' },
  29051: { category: 'stickup', label: 'Convenience Store' },
  29052: { category: 'stickup', label: 'Fast Food' },
  29054: { category: 'stickup', label: 'Liquor Store' },
  29082: { category: 'fence', label: 'Contact' },
  29029: { category: 'paynspray', label: "Pay 'N' Spray" },
  29032: { category: 'modshop', label: 'Mod Shop' },
  29033: { category: 'gas', label: 'Gas Station' },
  29034: { category: 'vehicle', label: 'Car Wash' },
  29036: { category: 'transit', label: 'Bus Stop' },
  29038: { category: 'transit', label: 'Train Station' },
  29039: { category: 'transit', label: 'Ferry' },
  29040: { category: 'vehicle', label: 'Rental Vehicle' },
  29133: { category: 'illegal_op', label: 'Kingfishers' },
  29134: { category: 'illegal_op', label: 'Kolt & Associates' },
  29135: { category: 'illegal_op', label: 'M7' },
  29136: { category: 'illegal_op', label: 'La Polilla Negra' },
  29137: { category: 'illegal_op', label: 'Final Chapter' },
  29138: { category: 'illegal_op', label: 'San4San' },
  29139: { category: 'illegal_op', label: 'PTT Youngin$' },
  29140: { category: 'illegal_op', label: 'The Guardia Brothers' },
  29141: { category: 'illegal_op', label: 'Criminals' },
}

const TIPS = {
  ammunation: 'Armería marcada en el mapa de IGN. Carga chaleco antes del golpe.',
  jewelry: 'Joyería o pawn marcado en IGN. Caja fuerte trasera; vende el loot a un contacto.',
  payday: 'Financiera marcada en IGN. Billetes marcados: hay que venderlos.',
  illegal_op: 'Sitio de banda marcado en IGN. Trata el botín como droga o mercancía.',
  fence: 'Contacto marcado en IGN. Sin comprador el loot no es dinero.',
  bank_small: 'Sucursal marcada en IGN. Confirma en el juego si es bóveda o banco chico.',
  bank_vault: 'Banco grande marcado en IGN. Las bóvedas abren tarde y dan 4 estrellas.',
  paynspray: 'Pay ’n’ Spray marcado en IGN. Pierde estrellas y vende el coche con tracker.',
  vehicle: 'Lavadero, taller o alquiler marcado en IGN. El coche se limpia o se consigue aquí.',
  stickup: 'Tienda marcada en IGN. Caja rápida, entra por atrás.',
  gas: 'Gasolinera marcada en IGN.',
  transit: 'Parada o estación marcada en IGN. Rompe la línea de visión y pierde la persecución.',
  modshop: 'Taller de tuning marcado en IGN.',
}

/** Palabras que IGN añade y el pin curado no ("Gas Station" vs "Gas"). */
const OPTIONAL = new Set(['station', 'store', 'big', 'the', 'shop', 'sucursal', 'boveda'])

export function coreKey(name) {
  return norm(String(name ?? ''))
    .split(' ')
    .filter((t) => t && !OPTIONAL.has(t))
    .sort()
    .join(' ')
}

export function markerTitle(typeSlug, markerName) {
  const meta = IGN_TYPES[typeSlug]
  const name = String(markerName ?? '').trim()
  if (!meta) return name
  if (typeSlug === '29036' || typeSlug === '29038' || typeSlug === '29039') {
    if (norm(name).includes(norm(meta.label))) return name
    return `${meta.label} — ${name}`
  }
  return name
}

/** Pares {lng,lat,wx,wy} donde el nombre de IGN y un pin conocido coinciden
 *  en una sola ficha. Los nombres de un solo token se ignoran: "Downtown"
 *  no ancla una proyección. */
export function matchControlPairs(markers, controls) {
  const by = new Map()
  for (const point of controls) {
    const key = coreKey(point.name)
    if (key.split(' ').length < 2) continue
    if (!by.has(key)) by.set(key, [])
    by.get(key).push(point)
  }
  const pairs = []
  for (const marker of markers) {
    const key = coreKey(marker.markerName)
    if (key.split(' ').length < 2) continue
    const hits = by.get(key)
    if (!hits || hits.length !== 1) continue
    if (!Number.isFinite(marker.lng) || !Number.isFinite(marker.lat)) continue
    pairs.push({ lng: marker.lng, lat: marker.lat, wx: hits[0].wx, wy: hits[0].wy })
  }
  return pairs
}

function fitAxis(xs, ys) {
  const n = xs.length
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sx += xs[i]
    sy += ys[i]
    sxx += xs[i] * xs[i]
    sxy += xs[i] * ys[i]
  }
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const a = (n * sxy - sx * sy) / denom
  const b = (sy - a * sx) / n
  return { a, b }
}

function residual(model, pair) {
  const x = model.x.a * pair.lng + model.x.b
  const y = model.y.a * pair.lat + model.y.b
  return Math.hypot(x - pair.wx, y - pair.wy)
}

function medianOf(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * wx = ax·lng + bx, wy = ay·lat + by. Prueba cada par de anclas y se queda
 * con el ajuste que mete más puntos dentro de `threshold`. Un mínimos
 * cuadrados directo se deja arrastrar por pines curados mal puestos.
 * Null si ninguna hipótesis ancla: mejor no publicar que clavar en el pantano.
 */
export function fitIgnProjection(pairs, { threshold = 80, minInliers = 6, maxMedian = 40 } = {}) {
  if (!Array.isArray(pairs) || pairs.length < minInliers) return null
  let best = null
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const seedX = fitAxis([pairs[i].lng, pairs[j].lng], [pairs[i].wx, pairs[j].wx])
      const seedY = fitAxis([pairs[i].lat, pairs[j].lat], [pairs[i].wy, pairs[j].wy])
      if (!seedX || !seedY) continue
      const seed = { x: seedX, y: seedY }
      const inliers = pairs.filter((p) => residual(seed, p) < threshold)
      if (inliers.length < minInliers) continue
      const x = fitAxis(inliers.map((p) => p.lng), inliers.map((p) => p.wx))
      const y = fitAxis(inliers.map((p) => p.lat), inliers.map((p) => p.wy))
      if (!x || !y) continue
      const model = { x, y }
      const median = medianOf(inliers.map((p) => residual(model, p)))
      if (median > maxMedian) continue
      if (!best || inliers.length > best.inliers || (inliers.length === best.inliers && median < best.median)) {
        best = { model, inliers: inliers.length, median }
      }
    }
  }
  if (!best) return null
  return {
    inliers: best.inliers,
    median: best.median,
    project(lng, lat) {
      return [Math.round(best.model.x.a * lng + best.model.x.b), Math.round(best.model.y.a * lat + best.model.y.b)]
    },
  }
}

export function readControlPoints(root) {
  const read = (rel) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, root)), 'utf8'))
  const seeds = read('../src/data/seeds.json')
  const pins = read('../src/data/landmarkPins.json')
  return [
    ...seeds.filter((s) => Array.isArray(s.at)).map((s) => ({ name: s.name, wx: s.at[0], wy: s.at[1] })),
    ...pins.map((p) => ({ name: p.name, wx: p.wx, wy: p.wy })),
  ]
}

export async function fetchIgnMarkers() {
  const variables = {
    mapGenieGameId: 353,
    mapId: 1100,
    typeSlugs: Object.keys(IGN_TYPES),
  }
  const url =
    `${IGN_MARKERS_URL}?operationName=MapGenieMarkersMultiple&variables=` +
    encodeURIComponent(JSON.stringify(variables)) +
    '&extensions=' +
    encodeURIComponent(JSON.stringify({ persistedQuery: { version: 1, sha256Hash: PERSISTED_QUERY } }))
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      origin: 'https://www.ign.com',
      referer: 'https://www.ign.com/maps/gta-6/leonida',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'apollo-require-preflight': 'true',
      'x-apollo-operation-name': 'MapGenieMarkersMultiple',
    },
  })
  if (!response.ok) throw new Error(`IGN respondió ${response.status}`)
  const json = await response.json()
  if (json.errors?.length) throw new Error(`IGN: ${json.errors[0].message}`)
  const markers = json.data?.mapGenieMarkersMultiple
  if (!Array.isArray(markers) || markers.length < 100) {
    throw new Error(`IGN: ${markers?.length ?? 0} marcadores (esperados >100). ¿Cambió la query?`)
  }
  return markers
}

/** Marcador de IGN → pin de discovered.json, o null si no cae en el mundo. */
export function ignMarkerToPin(marker, project) {
  const typeSlug = String(marker.typeSlug)
  const meta = IGN_TYPES[typeSlug]
  if (!meta) return null
  const name = markerTitle(typeSlug, marker.markerName)
  if (name.length < 2 || name.length > 120) return null
  const [wx, wy] = project(marker.lng, marker.lat)
  if (!Number.isFinite(wx) || !Number.isFinite(wy) || Math.abs(wx) > 16000 || Math.abs(wy) > 16000) return null
  const id = `ign-${marker.mapGenieLocationId}`
  const crew = meta.category === 'illegal_op' ? ` Banda: ${meta.label}.` : ''
  return {
    id,
    name,
    category: meta.category,
    region: nearestRegion(wx, wy),
    area: nearestArea(wx, wy),
    wx,
    wy,
    precision: 'exact',
    confidence: 'medium',
    tip: `${TIPS[meta.category]}${crew} Posición proyectada desde el mapa de IGN Leonida.`,
    source: `ign ${marker.mapGenieLocationId} (${meta.label})`,
  }
}
