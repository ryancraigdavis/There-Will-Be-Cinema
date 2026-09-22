import type { AABB, PointXZ } from '../player/collision'

function slab(origin: number, direction: number, min: number, max: number): [number, number] {
  const inverse = 1 / direction
  const t1 = (min - origin) * inverse
  const t2 = (max - origin) * inverse
  return [Math.min(t1, t2), Math.max(t1, t2)]
}

export function rayHitsBox(origin: PointXZ, direction: PointXZ, box: AABB): number | null {
  const [nearX, farX] = slab(origin.x, direction.x, box.minX, box.maxX)
  const [nearZ, farZ] = slab(origin.z, direction.z, box.minZ, box.maxZ)
  const near = Math.max(0, nearX, nearZ)
  const far = Math.min(farX, farZ)
  return near <= far ? near : null
}

export function rayClearance(
  origin: PointXZ,
  direction: PointXZ,
  boxes: readonly AABB[],
  far: number,
): number {
  const hits = boxes
    .map((box) => rayHitsBox(origin, direction, box))
    .filter((distance): distance is number => distance !== null)
  return Math.min(far, ...hits)
}
