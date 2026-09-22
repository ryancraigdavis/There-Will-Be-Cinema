import type { Transform } from '../ui3d/Instanced'
import { ROOM } from './constants'

export const WALL_THICKNESS = 0.1
const WIDTH = ROOM.maxX - ROOM.minX
const DEPTH = ROOM.maxZ - ROOM.minZ
const CENTER_X = (ROOM.maxX + ROOM.minX) / 2
const CENTER_Z = (ROOM.maxZ + ROOM.minZ) / 2
export const TROFFER = {
  xs: [-4.5, -1.5, 1.5, 4.5],
  zs: [-12, -9, -6, -3, 0, 3, 6],
  size: [1.2, 0.6],
} as const

interface WallSide {
  x: number
  z: number
  length: number
  yaw: number
}

export const WALL_SIDES: readonly WallSide[] = [
  { x: ROOM.minX - WALL_THICKNESS / 2, z: CENTER_Z, length: DEPTH, yaw: Math.PI / 2 },
  { x: ROOM.maxX + WALL_THICKNESS / 2, z: CENTER_Z, length: DEPTH, yaw: Math.PI / 2 },
  { x: CENTER_X, z: ROOM.minZ - WALL_THICKNESS / 2, length: WIDTH, yaw: 0 },
  { x: CENTER_X, z: ROOM.maxZ + WALL_THICKNESS / 2, length: WIDTH, yaw: 0 },
]

export interface WallBand {
  id: 'lower' | 'trim' | 'upper' | 'base'
  y: number
  height: number
  thickness: number
}

export const WALL_BANDS: readonly WallBand[] = [
  { id: 'lower', y: 0.55, height: 1.1, thickness: WALL_THICKNESS },
  { id: 'trim', y: 1.13, height: 0.06, thickness: WALL_THICKNESS + 0.01 },
  { id: 'upper', y: 2.08, height: 1.84, thickness: WALL_THICKNESS },
  { id: 'base', y: 0.05, height: 0.1, thickness: WALL_THICKNESS + 0.02 },
]

export function bandTransforms(band: WallBand): Transform[] {
  return WALL_SIDES.map((side) => ({
    position: [side.x, band.y, side.z],
    yaw: side.yaw,
    scale: [side.length, band.height, band.thickness],
  }))
}

export function trofferTransforms(): Transform[] {
  return TROFFER.xs.flatMap((x) =>
    TROFFER.zs.map(
      (z): Transform => ({
        position: [x, ROOM.height - 0.01, z],
        quaternion: [Math.SQRT1_2, 0, 0, Math.SQRT1_2],
      }),
    ),
  )
}
