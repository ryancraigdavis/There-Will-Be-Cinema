import type { Vec3 } from '../scene/math'

export interface PointLightSpec {
  position: Vec3
  intensity: number
  distance: number
  decay: number
  color: string
}

export interface LightRig {
  hemisphere: { sky: string; ground: string; intensity: number }
  ambient: { color: string; intensity: number }
  directional: { position: Vec3; intensity: number; color: string }
  points: PointLightSpec[]
}

export const LIGHT_RIG: LightRig = {
  hemisphere: { sky: '#fff1d6', ground: '#3a1a10', intensity: 1.6 },
  ambient: { color: '#ffe2b8', intensity: 0.35 },
  directional: { position: [3, 7, 4], intensity: 0.9, color: '#fff4e0' },
  points: [
    { position: [3.4, 2.6, 3.2], intensity: 7, distance: 8, decay: 1.5, color: '#ffd9a0' },
    { position: [0, 2.7, -4], intensity: 6, distance: 10, decay: 1.5, color: '#fff0d8' },
    { position: [0, 2.7, -10], intensity: 6, distance: 10, decay: 1.5, color: '#fff0d8' },
  ],
}
