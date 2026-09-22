import { Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../scene/math'
import { PALETTE } from '../theme/palette'
import type { Transform } from '../ui3d/Instanced'

export const DERRICK_SHAPE = { height: 2.8, base: 0.5, top: 0.13 } as const
const RING_HEIGHTS = [0.3, 0.58, 0.85]
const BRACE_SPANS: [number, number][] = [
  [0.02, 0.3],
  [0.3, 0.58],
  [0.58, 0.85],
]
const SIDES: [number, number][] = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
]
const UP = new Vector3(0, 1, 0)
const BRACE_COLOR = '#4b3220'

export function corner(height: number, sx: number, sz: number): Vec3 {
  const half = DERRICK_SHAPE.base + (DERRICK_SHAPE.top - DERRICK_SHAPE.base) * height
  return [sx * half, height * DERRICK_SHAPE.height, sz * half]
}

export function beam(from: Vec3, to: Vec3, thickness: number, color: string): Transform {
  const start = new Vector3(...from)
  const end = new Vector3(...to)
  const direction = end.clone().sub(start)
  const q = new Quaternion().setFromUnitVectors(UP, direction.clone().normalize())
  const mid = start.add(end).multiplyScalar(0.5)
  return {
    position: [mid.x, mid.y, mid.z],
    quaternion: [q.x, q.y, q.z, q.w],
    scale: [thickness, direction.length(), thickness],
    color,
  }
}

const next = (i: number) => SIDES[(i + 1) % SIDES.length] as [number, number]

export function derrickBeams(): Transform[] {
  const legs = SIDES.map(([sx, sz]) =>
    beam(corner(0, sx, sz), corner(1, sx, sz), 0.075, PALETTE.wood),
  )
  const rings = RING_HEIGHTS.flatMap((h) =>
    SIDES.map(([sx, sz], i) => beam(corner(h, sx, sz), corner(h, ...next(i)), 0.045, PALETTE.wood)),
  )
  const braces = BRACE_SPANS.flatMap(([low, high]) =>
    SIDES.map(([sx, sz], i) =>
      beam(corner(low, sx, sz), corner(high, ...next(i)), 0.032, BRACE_COLOR),
    ),
  )
  return [...legs, ...rings, ...braces]
}
