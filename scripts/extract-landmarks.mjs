// Genera src/data/landmarkPins.ts a partir de los landmarks de gtadb.org (CC BY 4.0).
// Uso: node scripts/extract-landmarks.mjs
import { writeFileSync } from 'node:fs'

const SRC = 'https://cdn.jsdelivr.net/gh/rolux/gtadb.org@main/map/data/6/landmarks.json'

const TAGS = {
  '#gas': 'gas',
  '#supermarket': 'store',
  '#airport': 'airport',
  '#train': 'transit',
  '#metro': 'transit',
  '#metromover': 'transit',
  '#modshop': 'modshop',
  '#hospital': 'hospital',
}

const FALLBACK_NAME = {
  gas: 'Gasolinera',
  store: 'Supermercado',
  airport: 'Aeródromo',
  transit: 'Estación',
  modshop: 'Mod shop',
  hospital: 'Hospital',
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

const isDead = (t) =>
  ['demolished', 'closed', 'cancelled'].includes(t) || t.startsWith('//doesnt') || t.startsWith('//duplicate')

const data = await (await fetch(SRC)).json()
const pins = []
for (const [id, v] of Object.entries(data)) {
  const tags = v[6] ?? []
  if (tags.some(isDead)) continue
  const tag = tags.find((t) => TAGS[t])
  if (!tag) continue
  const category = TAGS[tag]
  const [x, y] = v[1]
  const parts = String(v[0]).split(', ')
  const name = parts[0] && parts[0] !== '?' ? parts[0] : FALLBACK_NAME[category]
  pins.push({
    id: `gtadb-${id}`,
    name,
    category,
    region: nearestRegion(x, y),
    area: parts[1] ?? parts[0],
    wx: Math.round(x),
    wy: Math.round(y),
    unconfirmed: tags.includes('unconfirmed'),
  })
}
pins.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

const out = `// Generado por scripts/extract-landmarks.mjs — no editar a mano.
// Fuente: gtadb.org map/data/6/landmarks.json (CC BY 4.0).
import type { LandmarkPin } from './types'

export const LANDMARK_PINS: LandmarkPin[] = ${JSON.stringify(pins, null, 2)}
`
writeFileSync(new URL('../src/data/landmarkPins.ts', import.meta.url), out)
console.log(`${pins.length} pins escritos`)
