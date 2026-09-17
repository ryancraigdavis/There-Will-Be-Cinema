import type { AtlasIndex } from '../catalog/types'

export const LOD_DISTANCES = { full: 3, mid: 8 } as const
export const PICK_DISTANCE = 6

export function availableLevels(index: AtlasIndex | null): number[] {
  const levels = index?.levels?.length ? index.levels : index ? [index.size] : []
  return [...levels].sort((a, b) => a - b)
}

export const HOLD_FULL = 1
export const STILL_METRES = 0.05

export interface LevelContext {
  settled?: boolean
  current?: number | null
}

export function levelFor(
  distance: number,
  levels: readonly number[],
  maxSize: number,
  { settled = true, current = null }: LevelContext = {},
): number | null {
  const usable = levels.filter((size) => size <= maxSize)
  const top = usable.length - 1
  const holding = current === usable[top] && distance <= LOD_DISTANCES.full + HOLD_FULL
  const close = settled && distance <= LOD_DISTANCES.full
  const middle = distance <= LOD_DISTANCES.mid ? Math.min(1, top) : 0
  return usable[Math.max(0, close || holding ? top : middle)] ?? null
}
