export type BenchAction = 'enter' | 'walk' | 'select'

export interface BenchSegment {
  label: string
  frames: number
  keys?: readonly string[]
  action?: BenchAction
}

export const ROUTE: readonly BenchSegment[] = [
  { label: 'counter', frames: 120, action: 'enter' },
  { label: 'walk-in', frames: 130, action: 'walk' },
  { label: 'into-aisle', frames: 150, keys: ['KeyW'] },
  { label: 'brief-pause', frames: 35 },
  { label: 'walk-on', frames: 90, keys: ['KeyW'] },
  { label: 'to-shelf', frames: 20, keys: ['KeyD'] },
  { label: 'dwell-shelf', frames: 120 },
  { label: 'select', frames: 60, action: 'select' },
  { label: 'deselect-walk', frames: 100, keys: ['KeyW'] },
  { label: 'walk-back', frames: 340, keys: ['KeyS'] },
  { label: 'to-new-releases', frames: 150, keys: ['KeyD'] },
  { label: 'dwell-new-releases', frames: 180 },
  { label: 'back-to-gate', frames: 150, keys: ['KeyA'] },
]

export function totalFrames(route: readonly BenchSegment[]): number {
  return route.reduce((sum, segment) => sum + segment.frames, 0)
}

export function segmentIndexAt(route: readonly BenchSegment[], frame: number): number {
  const ends = route.map((_, i) => totalFrames(route.slice(0, i + 1)))
  return frame < 0 ? -1 : ends.findIndex((end) => frame < end)
}

export function keyChanges(
  held: readonly string[],
  next: readonly string[],
): { up: string[]; down: string[] } {
  return {
    up: held.filter((code) => !next.includes(code)),
    down: next.filter((code) => !held.includes(code)),
  }
}

interface Placed {
  itemId: string
  position: readonly [number, number, number]
}

export function nearestItem(slots: readonly Placed[], x: number, z: number): string | null {
  const distance = (slot: Placed) => Math.hypot(slot.position[0] - x, slot.position[2] - z)
  const nearest = slots.reduce<Placed | null>(
    (best, slot) => (best && distance(best) <= distance(slot) ? best : slot),
    null,
  )
  return nearest?.itemId ?? null
}
