import pinsJson from './landmarkPins.json'
import type { LandmarkPin } from './types'

export const LANDMARK_PINS: LandmarkPin[] = pinsJson as unknown as LandmarkPin[]
