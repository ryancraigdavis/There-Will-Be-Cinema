import { clamp } from '../scene/math'

export interface AABB {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface PointXZ {
  x: number
  z: number
}

export function overlapsCircle(center: PointXZ, radius: number, box: AABB): boolean {
  const nearestX = clamp(center.x, box.minX, box.maxX)
  const nearestZ = clamp(center.z, box.minZ, box.maxZ)
  return (center.x - nearestX) ** 2 + (center.z - nearestZ) ** 2 < radius * radius
}

export function isBlocked(center: PointXZ, radius: number, boxes: readonly AABB[]): boolean {
  return boxes.some((box) => overlapsCircle(center, radius, box))
}

const NOTHING: readonly AABB[] = []

export function moveCircle(
  from: PointXZ,
  delta: PointXZ,
  radius: number,
  boxes: readonly AABB[],
): PointXZ {
  const walls = isBlocked(from, radius, boxes) ? NOTHING : boxes
  const stepX = { x: from.x + delta.x, z: from.z }
  const x = isBlocked(stepX, radius, walls) ? from.x : stepX.x
  const stepZ = { x, z: from.z + delta.z }
  return { x, z: isBlocked(stepZ, radius, walls) ? from.z : stepZ.z }
}

export function boxesOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ
}
