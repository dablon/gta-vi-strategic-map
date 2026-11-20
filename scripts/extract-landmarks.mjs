// Regenera src/data/landmarkPins.json desde los landmarks de gtadb.org (CC BY 4.0).
// Solo ingresa sitios con hashtag confirmado de la comunidad (HASH_TAGS).
// La clasificación por nombre y los tags secundarios viven en discover-locations.mjs.
// Uso: node scripts/extract-landmarks.mjs
import { writeFileSync } from 'node:fs'
import { classify, eachUsable, LANDMARKS_SRC, parseLandmarks } from './lib/gtadb.mjs'
import { nearestRegion } from '../src/data/resolve.mjs'

const FALLBACK_NAME = {
  gas: 'Gasolinera',
  store: 'Supermercado',
  airport: 'Aeródromo',
  transit: 'Estación',
  modshop: 'Mod shop',
  hospital: 'Hospital',
  ammunation: 'Armería',
  paynspray: "Pay 'n' Spray",
  police: 'Comisaría',
  marina: 'Marina',
  safehouse: 'Safehouse',
  vehicle: 'Taller',
  stickup: 'Tienda',
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
  console.error(String(err.message ?? err))
  process.exit(1)
}

const pins = []
for (const lm of eachUsable(entries)) {
  const match = classify(lm.name, lm.tags)
  if (!match || match.via !== 'hash') continue
  const name = lm.name ?? FALLBACK_NAME[match.category] ?? match.category
  pins.push({
    id: `gtadb-${lm.id}`,
    name,
    category: match.category,
    region: nearestRegion(lm.x, lm.y),
    area: lm.area ?? name,
    wx: lm.x,
    wy: lm.y,
    unconfirmed: lm.unconfirmed,
    confidence: lm.unconfirmed ? 'low' : 'medium',
  })
}

pins.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

// JSON puro: los comentarios no existen en JSON y Vite lo importa directo.
// Proveniencia: cada pin lleva id "gtadb-*"; la fuente se documenta en README.
writeFileSync(new URL('../src/data/landmarkPins.json', import.meta.url), `${JSON.stringify(pins, null, 2)}\n`)
console.log(`${pins.length} pins escritos (confidence low: ${pins.filter((p) => p.confidence === 'low').length})`)
