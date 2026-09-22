import type { AtlasIndex } from '../catalog/types'
import { BOX } from './constants'

export const PICK_DISTANCE = 6
export const HOLD_FULL = 1
export const STILL_METRES = 0.05
export const MOVED_METRES = 0.001
export const FULL_RANGE = { min: 1, max: 3 } as const
export const LOD_INTERVAL_FRAMES = 15

export function availableLevels(index: AtlasIndex | null): number[] {
  const levels = index?.levels?.length ? index.levels : index ? [index.size] : []
  return [...levels].sort((a, b) => a - b)
}

export function usableLevels(
  levels: readonly number[],
  maxSize: number,
  warm: number | null,
): number[] {
  return levels.filter((size) => size <= maxSize && size >= (warm ?? 0))
}

export function fullLevel(usable: readonly number[], warm: number | null): number | null {
  const top = usable.at(-1) ?? null
  return top !== null && top !== warm ? top : null
}

export function coverPixels(index: AtlasIndex, level: number): number {
  return (index.cell[1] * level) / index.size
}

export function fullDistance(
  viewportPx: number,
  fovDegrees: number,
  cellPx: number,
  coverMetres = BOX.height,
): number {
  const halfFov = Math.tan((fovDegrees * Math.PI) / 360)
  const exact = (coverMetres * viewportPx) / (2 * cellPx * halfFov)
  return Math.min(FULL_RANGE.max, Math.max(FULL_RANGE.min, exact))
}
