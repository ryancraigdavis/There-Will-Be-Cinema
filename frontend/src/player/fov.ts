import type { RigMode } from './cameraRig'

export const BASE_FOV: Record<RigMode, number> = {
  intro: 70,
  counter: 70,
  focus: 60,
  entering: 66,
  free: 66,
}

const PORTRAIT_BOOST = 45
const MAX_FOV = 100

export function fovFor(mode: RigMode, aspect: number): number {
  return Math.min(MAX_FOV, BASE_FOV[mode] + Math.max(0, 1 - aspect) * PORTRAIT_BOOST)
}
