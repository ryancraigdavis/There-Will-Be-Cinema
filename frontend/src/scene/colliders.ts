import { BULLETIN, COUNTER, GATE, KIOSK } from '../lobby/anchors'
import type { AABB } from '../player/collision'
import { ROOM } from '../store/constants'
import type { StorePlan } from '../store/layout'

function roomWalls(): AABB[] {
  const { minX, maxX, minZ, maxZ, wall } = ROOM
  return [
    { minX: minX - wall, maxX: minX, minZ: minZ - wall, maxZ: maxZ + wall },
    { minX: maxX, maxX: maxX + wall, minZ: minZ - wall, maxZ: maxZ + wall },
    { minX: minX - wall, maxX: maxX + wall, minZ: minZ - wall, maxZ: minZ },
    { minX: minX - wall, maxX: maxX + wall, minZ: maxZ, maxZ: maxZ + wall },
  ]
}

function gatePost(x: number): AABB {
  const r = GATE.postRadius
  return { minX: x - r, maxX: x + r, minZ: GATE.z - r, maxZ: GATE.z + r }
}

export const LOBBY_COLLIDERS: readonly AABB[] = [
  { minX: COUNTER.minX, maxX: COUNTER.maxX, minZ: COUNTER.minZ, maxZ: COUNTER.maxZ },
  gatePost(GATE.x - GATE.halfWidth),
  gatePost(GATE.x + GATE.halfWidth),
  {
    minX: KIOSK.x - KIOSK.half,
    maxX: KIOSK.x + KIOSK.half,
    minZ: KIOSK.z - KIOSK.half,
    maxZ: KIOSK.z + KIOSK.half,
  },
  {
    minX: BULLETIN.x - BULLETIN.halfFootprint,
    maxX: BULLETIN.x + BULLETIN.halfFootprint,
    minZ: BULLETIN.z - BULLETIN.halfFootprint,
    maxZ: BULLETIN.z + BULLETIN.halfFootprint,
  },
]

export function sceneColliders(plan: StorePlan | null): AABB[] {
  return [...roomWalls(), ...LOBBY_COLLIDERS, ...(plan?.colliders ?? [])]
}
