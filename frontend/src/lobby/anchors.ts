import { EYE_HEIGHT } from '../player/locomotion'
import { type Pose, poseLookingAt, type Vec3 } from '../scene/math'
import { GONDOLA } from '../store/constants'

export type AnchorId = 'counter' | 'storeEntry'

export const COUNTER = { minX: 0.9, maxX: 4.1, minZ: 2.2, maxZ: 3, height: 1.05 } as const
export const GATE = { x: 0, z: 2.6, halfWidth: 0.7, postRadius: 0.07, height: 2.35 } as const
export const POPCORN = { x: 5.1, z: 3.45, yaw: -1, half: 0.45 } as const
export const GUMBALL = { x: 0.72, z: 3.4, yaw: -0.05, half: 0.28 } as const
export const DERRICK = { x: -4.6, z: 6.5, yaw: 0.4, half: 0.85 } as const
export const KIOSK = { x: -2.35, z: 1.25, yaw: 0.5, half: 0.3 } as const
export const BULLETIN = { x: -1.6, z: 3.9, y: 1.45, yaw: 0.72, halfFootprint: 0.4 } as const

const TOP = COUNTER.height
const FRONT_Z = COUNTER.maxZ - 0.28

export const FIXTURES = {
  telephone: [3.5, TOP, FRONT_Z],
  suggestion: [1.45, TOP, FRONT_Z],
  register: [2.35, TOP, 2.5],
  crt: [2.95, TOP, 2.45],
  logo: [2.5, 2.2, 2.6],
  bulletin: [BULLETIN.x, BULLETIN.y, BULLETIN.z],
} as const satisfies Record<string, Vec3>

export const ANCHORS: Record<AnchorId, Pose> = {
  counter: poseLookingAt([0.6, EYE_HEIGHT, 6.4], [0.7, 1.25, 1.5]),
  storeEntry: poseLookingAt([0, EYE_HEIGHT, 1.6], [0, 1.3, GONDOLA.frontZ - 4]),
}
