import type { z } from 'zod'
import type { LandmarkPin, MapLocation, Seed, Suggestion } from './types'

export declare const CATEGORY_IDS: string[]
export declare const REGION_IDS: string[]
export declare const SeedSchema: z.ZodType<Seed>
export declare const PinSchema: z.ZodType<MapLocation>
export declare const LandmarkPinSchema: z.ZodType<LandmarkPin>
export declare const SuggestionSchema: z.ZodType<Suggestion>
export declare const DiscoveredFileSchema: z.ZodType<{
  schemaVersion?: number
  updatedAt?: string | null
  locations: MapLocation[]
}>
export declare const SuggestionFileSchema: z.ZodType<{ suggestions: Suggestion[] }>
export declare function uniqueIds(list: Array<{ id: string }>): string[]
