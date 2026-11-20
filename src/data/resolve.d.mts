import type { MapLocation, RegionId, Seed } from './types'

export declare const AREA_CENTROIDS: Record<string, [number, number]>
export declare const REGION_CENTERS: Record<RegionId, [number, number]>
export declare function nearestRegion(wx: number, wy: number): RegionId
export declare function build(seed: Seed): MapLocation
