// Valida todos los datos del repo contra src/data/pinSchema.mjs.
// Corre en CI (validate.yml) y localmente: node scripts/validate-data.mjs
import { existsSync, readFileSync } from 'node:fs'
import {
  DiscoveredFileSchema,
  LandmarkPinSchema,
  SeedSchema,
  SuggestionFileSchema,
  uniqueIds,
} from '../src/data/pinSchema.mjs'
import { AREA_CENTROIDS, build } from '../src/data/resolve.mjs'

const read = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
const errors = []

function check(name, schema, list) {
  for (const item of list) {
    const res = schema.safeParse(item)
    if (!res.success) {
      const id = item?.id ?? item?.issue ?? '?'
      errors.push(`${name} [${id}]: ${res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`)
    }
  }
  const dupes = uniqueIds(list)
  if (dupes.length) errors.push(`${name}: ids duplicados: ${dupes.join(', ')}`)
  return list
}

const seeds = check('seeds.json', SeedSchema, read('../src/data/seeds.json'))
check('landmarkPins.json', LandmarkPinSchema, read('../src/data/landmarkPins.json'))
const discovered = existsSync(new URL('../public/discovered.json', import.meta.url))
  ? DiscoveredFileSchema.safeParse(read('../public/discovered.json'))
  : { success: true }
if (!discovered.success) errors.push(`discovered.json: ${discovered.error.message}`)
if (existsSync(new URL('../public/suggestions.json', import.meta.url))) {
  const suggestions = SuggestionFileSchema.safeParse(read('../public/suggestions.json'))
  if (!suggestions.success) errors.push(`suggestions.json: ${suggestions.error.message}`)
}

// Cada seed debe resolverse a coordenadas reales: si pide un centroide que no
// existe, build() lanza y la CI lo pinta rojo (antes solo explota en runtime).
for (const seed of seeds) {
  try {
    build(seed)
  } catch (err) {
    errors.push(`seeds.json [${seed.id}]: ${err.message}`)
  }
}
// Payouts invertidos.
for (const seed of seeds) {
  if (seed.payoutMin != null && seed.payoutMax != null && seed.payoutMin > seed.payoutMax) {
    errors.push(`seeds.json [${seed.id}]: payoutMin > payoutMax`)
  }
}

const knownCentroids = Object.keys(AREA_CENTROIDS).length
if (knownCentroids < 20) errors.push(`resolve.mjs: solo ${knownCentroids} centroides cargados`)

if (errors.length) {
  console.error(`validate-data: ${errors.length} problema(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`validate-data: OK (${seeds.length} seeds, datos consistentes)`)
