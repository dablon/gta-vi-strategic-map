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

/** typeSlug de IGN → categoría del atlas. `prefix` antepone el tipo cuando el
 *  nombre del marcador no lo dice ("Slinger" es ropa, "Leith River" es un puente). */
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
  29021: { category: 'atm', label: 'ATM' },
  29037: { category: 'atm', label: 'ATM (Towable)' },
  29042: { category: 'clothing', label: 'Casual & Street', prefix: true },
  29043: { category: 'clothing', label: 'Sportswear', prefix: true },
  29044: { category: 'clothing', label: 'Formal', prefix: true },
  29045: { category: 'clothing', label: 'Souvenir & Swimwear', prefix: true },
  29046: { category: 'clothing', label: 'Thrift', prefix: true },
  29047: { category: 'clothing', label: 'Footwear', prefix: true },
  29048: { category: 'clothing', label: 'Hair & Beauty', prefix: true },
  29049: { category: 'clothing', label: 'Tattoos', prefix: true },
  29050: { category: 'clothing', label: 'Electronics', prefix: true },
  29055: { category: 'bar', label: 'Bar' },
  29065: { category: 'collectible', label: 'Landmark', prefix: true },
  29066: { category: 'collectible', label: 'Curiosity', prefix: true },
  29067: { category: 'collectible', label: 'Sculpture', prefix: true },
  29093: { category: 'collectible', label: 'Book Swap', prefix: true },
  29120: { category: 'collectible', label: 'Magazine', prefix: true },
  29143: { category: 'collectible', label: 'Unique Playlist', prefix: true },
  29144: { category: 'collectible', label: '1010 Mural', prefix: true },
  29112: { category: 'collectible', label: 'Jack of Hearts', prefix: true },
  29113: { category: 'collectible', label: 'Delights', prefix: true },
  29114: { category: 'collectible', label: 'Nine1Nine', prefix: true },
  29019: { category: 'stunt', label: 'Stunt Jump' },
  29057: { category: 'stunt', label: 'Base Jump' },
  29059: { category: 'stunt', label: 'Knife Flight', prefix: true },
  29060: { category: 'stunt', label: 'Under the Bridge', prefix: true },
  29030: { category: 'gym', label: 'Gym', prefix: true },
  29031: { category: 'club', label: 'Club', prefix: true },
  29083: { category: 'safe', label: 'Safe' },
  29035: { category: 'charger', label: 'Electric Charger', prefix: true },
  29062: { category: 'garage', label: 'Purchasable Garage', prefix: true },
  29063: { category: 'garage', label: 'Garage', prefix: true },
  29095: { category: 'rare_vehicle', label: 'Standout Vehicle', prefix: true },
  29096: { category: 'rare_vehicle', label: 'Randy Vehicle', prefix: true },
  29097: { category: 'rare_vehicle', label: 'Moses Vehicle', prefix: true },
  29053: { category: 'food', label: 'Cafes & Takeout', prefix: true },
  29056: { category: 'food', label: 'Street Food', prefix: true },
  29011: { category: 'sport', label: 'Basketball Hoop', prefix: true },
  29013: { category: 'sport', label: 'Golf Course', prefix: true },
  29015: { category: 'sport', label: 'Mini-Golf', prefix: true },
  29061: { category: 'sport', label: 'Pool Table', prefix: true },
  29017: { category: 'activity', label: 'Shooting Range', prefix: true },
  29028: { category: 'activity', label: 'Arcade', prefix: true },
  29099: { category: 'activity', label: 'Fishing Hotspot', prefix: true },
  29084: { category: 'race', label: 'Racing Introduction', prefix: true },
  29085: { category: 'race', label: 'Racing Challenge', prefix: true },
  29086: { category: 'race', label: 'Thrillbilly Mud Club', prefix: true },
  29087: { category: 'race', label: 'Animal Crackers', prefix: true },
  29088: { category: 'race', label: "Hit 'n' Run VC", prefix: true },
  29089: { category: 'race', label: 'Hamlet Boone Speedway', prefix: true },
  29090: { category: 'race', label: 'Ambrosia Raceway', prefix: true },
  29091: { category: 'race', label: 'Gellhorn Raceway', prefix: true },
  29142: { category: 'race', label: 'Top Fun Drones', prefix: true },
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
  atm: 'Cajero marcado en IGN. El remolcable se engancha y se abre lejos de la calle.',
  clothing: 'Tienda de ropa o estilo marcada en IGN.',
  bar: 'Bar marcado en IGN.',
  collectible: 'Coleccionable marcado en IGN.',
  stunt: 'Stunt marcado en IGN.',
  animal: 'Animal marcado en IGN.',
  gym: 'Gimnasio marcado en IGN.',
  club: 'Club nocturno marcado en IGN.',
  safe: 'Caja fuerte marcada en IGN. Está dentro del local, no en la calle.',
  charger: 'Cargador eléctrico marcado en IGN.',
  garage: 'Garaje marcado en IGN.',
  rare_vehicle: 'Vehículo raro o encargo marcado en IGN.',
  food: 'Café o puesto de comida marcado en IGN.',
  sport: 'Deporte marcado en IGN.',
  activity: 'Actividad marcada en IGN.',
  race: 'Carrera o desafío marcado en IGN.',
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
  const transit = typeSlug === '29036' || typeSlug === '29038' || typeSlug === '29039'
  if ((transit || meta.prefix) && !norm(name).includes(norm(meta.label))) {
    return `${meta.label} — ${name}`
  }
  return name
}

/** Los cajeros (y cualquier tipo con el mismo nombre repetido) se pisaban
 *  entre sí: el dedupe trata igual nombre a <400 m como el mismo sitio. */
export function disambiguateNames(pins) {
  const counts = new Map()
  for (const pin of pins) counts.set(pin.name, (counts.get(pin.name) ?? 0) + 1)
  const seq = new Map()
  for (const pin of pins) {
    if ((counts.get(pin.name) ?? 0) < 2) continue
    const key = `${pin.name}\0${pin.area}`
    const n = (seq.get(key) ?? 0) + 1
    seq.set(key, n)
    const next = `${pin.name} — ${pin.area} ${n}`
    pin.name = next.length > 120 ? next.slice(0, 120) : next
  }
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
  const name = markerTitle(typeSlug, marker.markerName).slice(0, 120)
  if (name.length < 2) return null
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
