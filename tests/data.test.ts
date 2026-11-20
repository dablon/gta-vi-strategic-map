import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  DiscoveredFileSchema,
  LandmarkPinSchema,
  SeedSchema,
  SuggestionFileSchema,
  uniqueIds,
} from '../src/data/pinSchema.mjs'
import { build } from '../src/data/resolve.mjs'
import { existsSync } from 'node:fs'

const load = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))

const seeds = load('../src/data/seeds.json')
const landmarks = load('../src/data/landmarkPins.json')

describe('seeds.json', () => {
  it('valida cada seed contra el schema', () => {
    for (const seed of seeds) {
      const res = SeedSchema.safeParse(seed)
      expect(res.success, `${seed.id}: ${res.success ? '' : JSON.stringify(res.error.issues)}`).toBe(true)
    }
  })

  it('no tiene ids duplicados', () => {
    expect(uniqueIds(seeds)).toEqual([])
  })

  it('todos los seeds resuelven a coordenadas', () => {
    for (const seed of seeds) {
      const pin = build(seed)
      expect(Number.isFinite(pin.wx)).toBe(true)
      expect(Number.isFinite(pin.wy)).toBe(true)
      expect(['exact', 'area']).toContain(pin.precision)
    }
  })

  it('cada seed resuelve con la precisión declarada (at = exacta, sin at = barrio)', () => {
    for (const seed of seeds) {
      const pin = build(seed)
      expect(pin.precision).toBe(seed.at ? 'exact' : 'area')
    }
  })
})

describe('landmarkPins.json', () => {
  it('valida contra el schema de pins generados', () => {
    for (const pin of landmarks) {
      const res = LandmarkPinSchema.safeParse(pin)
      expect(res.success, `${pin.id}: ${res.success ? '' : JSON.stringify(res.error.issues)}`).toBe(true)
    }
  })

  it('no pisa ids de los seeds', () => {
    const seedIds = new Set(seeds.map((s: { id: string }) => s.id))
    const clashes = landmarks.filter((p: { id: string }) => seedIds.has(p.id))
    expect(clashes).toEqual([])
  })

  it('los no-confirmados bajan a confidence low', () => {
    for (const pin of landmarks) {
      if (pin.unconfirmed) expect(pin.confidence).toBe('low')
    }
  })
})

describe('public/discovered.json (si existe en el árbol de trabajo)', () => {
  const path = new URL('../public/discovered.json', import.meta.url)
  if (!existsSync(path)) return
  it('valida contra el schema publicado', () => {
    const res = DiscoveredFileSchema.safeParse(load('../public/discovered.json'))
    expect(res.success, res.success ? '' : JSON.stringify(res.error.issues.slice(0, 3))).toBe(true)
  })

  it('no solapa ids con las capas locales', () => {
    const data = load('../public/discovered.json')
    const localIds = new Set([...seeds.map((s: { id: string }) => s.id), ...landmarks.map((p: { id: string }) => p.id)])
    const clashes = data.locations.filter((l: { id: string }) => localIds.has(l.id))
    expect(clashes).toEqual([])
  })
})

describe('public/suggestions.json (si existe)', () => {
  const path = new URL('../public/suggestions.json', import.meta.url)
  if (!existsSync(path)) return
  it('valida contra el schema', () => {
    const res = SuggestionFileSchema.safeParse(load('../public/suggestions.json'))
    expect(res.success, res.success ? '' : JSON.stringify(res.error.issues.slice(0, 3))).toBe(true)
  })
})
