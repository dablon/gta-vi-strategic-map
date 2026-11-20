// Único esquema de datos, usado por CI (validate-data.mjs), los scripts del bot
// y el navegador (validación en runtime de discovered/suggestions).
import { z } from 'zod'

export const CATEGORY_IDS = [
  'bank_vault',
  'bank_small',
  'jewelry',
  'stickup',
  'illegal_op',
  'fence',
  'payday',
  'paynspray',
  'police',
  'ammunation',
  'safehouse',
  'marina',
  'gas',
  'store',
  'airport',
  'transit',
  'modshop',
  'hospital',
  'vehicle',
]

export const REGION_IDS = [
  'vice_city',
  'vice_beach',
  'leonida_keys',
  'grassrivers',
  'capri',
  'port_gellhorn',
  'ambrosia',
  'leonard',
  'mount_kalaga',
  'hamlet',
]

const category = z.enum(CATEGORY_IDS)
const region = z.enum(REGION_IDS)
const worldCoord = z.number().finite().min(-16000).max(16000)
const money = z.number().int().nonnegative().max(10_000_000)

export const SeedSchema = z.object({
  id: z.string().min(3).max(80),
  name: z.string().min(2).max(120),
  category,
  region,
  area: z.string().min(2).max(80),
  tip: z.string().min(4).max(600),
  source: z.string().min(2).max(200),
  payoutMin: money.optional(),
  payoutMax: money.optional(),
  security: z.enum(['low', 'medium', 'high']).optional(),
  unlock: z.string().max(120).optional(),
  lootType: z.string().max(80).optional(),
  bestFor: z.string().max(80).optional(),
  at: z.tuple([worldCoord, worldCoord]).optional(),
  centroid: z.string().max(80).optional(),
  spread: z.number().positive().max(3000).optional(),
})

export const PinSchema = z.object({
  id: z.string().min(3).max(80),
  name: z.string().min(2).max(120),
  category,
  region,
  area: z.string().min(2).max(80),
  wx: worldCoord,
  wy: worldCoord,
  precision: z.enum(['exact', 'area']),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  payoutMin: money.optional(),
  payoutMax: money.optional(),
  security: z.enum(['low', 'medium', 'high']).optional(),
  unlock: z.string().max(120).optional(),
  lootType: z.string().max(80).optional(),
  bestFor: z.string().max(80).optional(),
  tip: z.string().min(4).max(600),
  source: z.string().min(2).max(200),
})

export const LandmarkPinSchema = z.object({
  id: z.string().startsWith('gtadb-'),
  name: z.string().min(2).max(120),
  category,
  region,
  area: z.string().min(2).max(80),
  wx: worldCoord,
  wy: worldCoord,
  unconfirmed: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
})

export const DiscoveredFileSchema = z.object({
  schemaVersion: z.number().int().optional(),
  updatedAt: z.string().nullable().optional(),
  locations: z.array(PinSchema),
})

export const SuggestionSchema = z.object({
  issue: z.number().int().positive(),
  url: z.string().min(1),
  name: z.string().min(3).max(120),
  category,
  region: region.optional(),
  area: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
  wx: worldCoord,
  wy: worldCoord,
})

export const SuggestionFileSchema = z.object({
  suggestions: z.array(SuggestionSchema),
})

export function uniqueIds(list) {
  const seen = new Set()
  const dupes = []
  for (const item of list) {
    if (seen.has(item.id)) dupes.push(item.id)
    seen.add(item.id)
  }
  return dupes
}
